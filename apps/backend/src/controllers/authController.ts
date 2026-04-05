import type { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import db from '../utils/db.js';
import { AppError } from '../utils/AppError.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateTokens = (userId: string) => {
  const payload = { userId };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'refresh_secret', { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const googleOAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (!token) {
      throw new AppError("OAuth token is required", 400);
    }

    const verifyOptions = {
      idToken: token,
      ...(process.env.GOOGLE_CLIENT_ID ? { audience: process.env.GOOGLE_CLIENT_ID } : {}),
    };

    const ticket = await googleClient.verifyIdToken(verifyOptions);

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      throw new AppError("Invalid Google token payload", 400);
    }

    const { email, name: fullName, picture: avatarUrl, sub: providerAccountId } = payload;

    let user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create user and oauth account
      user = await db.user.create({
        data: {
          email,
          fullName: fullName || 'Google User',
          avatarUrl: avatarUrl ?? null,
          oauthAccounts: {
            create: {
              provider: 'google',
              providerAccountId,
            },
          },
        },
      });
    } else {
      // Link account if not already linked
      const hasGoogleLinked = await db.oAuthAccount.findFirst({
        where: {
          userId: user.id,
          provider: 'google',
        },
      });

      if (!hasGoogleLinked) {
        await db.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: 'google',
            providerAccountId,
          },
        });
      }
    }

    if (!user) {
      throw new AppError('Failed to create or retrieve user', 500);
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    
    // Save refresh token to DB
    await db.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const githubOAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body;
    if (!code) {
      throw new AppError("OAuth code is required", 400);
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    const { access_token } = tokenResponse.data;
    if (!access_token) {
      throw new AppError("Invalid GitHub OAuth code", 400);
    }

    // Get user info from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const emailResponse = await axios.get('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const githubUser = userResponse.data;
    const emails = emailResponse.data;
    const primaryEmail = emails.find((e: any) => e.primary)?.email || emails[0]?.email;
    
    if (!primaryEmail) {
      throw new AppError("Unable to get an email from GitHub", 400);
    }

    const providerAccountId = githubUser.id.toString();

    let user = await db.user.findUnique({
      where: { email: primaryEmail },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          email: primaryEmail,
          fullName: githubUser.name || githubUser.login || 'GitHub User',
          avatarUrl: githubUser.avatar_url,
          oauthAccounts: {
            create: {
              provider: 'github',
              providerAccountId,
              accessToken: access_token,
            },
          },
        },
      });
    } else {
      const hasGithubLinked = await db.oAuthAccount.findFirst({
        where: {
          userId: user.id,
          provider: 'github',
        },
      });

      if (!hasGithubLinked) {
        await db.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: 'github',
            providerAccountId,
            accessToken: access_token,
          },
        });
      }
    }

    if (!user) {
      throw new AppError('Failed to create or retrieve user', 500);
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    
    // Save refresh token to DB
    await db.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};
