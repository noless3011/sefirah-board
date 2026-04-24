import type { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'node:crypto';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { ZodType } from 'zod';
import {
  RegisterPayloadSchema,
  LoginPayloadSchema,
  GoogleOAuthPayloadSchema,
  GitHubOAuthPayloadSchema,
  RefreshTokenPayloadSchema,
  ForgotPasswordPayloadSchema,
  ResetPasswordPayloadSchema,
  AuthUserSchema,
  AuthResponseSchema,
  RefreshTokenResponseSchema,
  ResetPasswordResponseSchema,
} from '@sefirah/shared';
import { logger } from '../utils/logger.js';
import db from '../utils/db.js';
import { AppError } from '../utils/AppError.js';

const ACCESS_TOKEN_TTL = '15m';
const DEFAULT_REFRESH_TOKEN_DAYS = 7;
const REMEMBER_ME_REFRESH_TOKEN_DAYS = 30;
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const parseBody = <T>(schema: ZodType<T>, payload: unknown): T => {
  const result = schema.safeParse(payload);
  if (result.success) {
    return result.data;
  }

  const details: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const field = issue.path.length > 0 ? issue.path.join('.') : 'body';
    if (!details[field]) {
      details[field] = [];
    }
    details[field].push(issue.message);
  }

  throw new AppError('Validation failed', 400, details);
};

const getRefreshTokenDays = (rememberMe?: boolean): number =>
  rememberMe ? REMEMBER_ME_REFRESH_TOKEN_DAYS : DEFAULT_REFRESH_TOKEN_DAYS;

const generateTokens = (userId: string) => {
  const payload = { userId };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: ACCESS_TOKEN_TTL,
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'refresh_secret', {
    expiresIn: `${DEFAULT_REFRESH_TOKEN_DAYS}d`,
  });
  return { accessToken, refreshToken };
};

const issueSession = async (userId: string, refreshTokenDays: number) => {
  const { accessToken, refreshToken } = generateTokens(userId);

  await db.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + refreshTokenDays * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken };
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const extractUserIdFromJwt = (decoded: string | JwtPayload): string | null => {
  if (typeof decoded === 'string') {
    return null;
  }
  const userId = decoded.userId;
  return typeof userId === 'string' && userId.length > 0 ? userId : null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, fullName } = parseBody(RegisterPayloadSchema, req.body);

    const normalizedEmail = normalizeEmail(email);
    const normalizedName = fullName.trim();
    if (!normalizedName) {
      throw new AppError('Validation failed', 400, {
        fullName: ['Full name is required'],
      });
    }

    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new AppError('Email already in use', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await db.user.create({
      data: {
        email: normalizedEmail,
        password: passwordHash,
        fullName: normalizedName,
      },
    });

    res
      .status(201)
      .json(ResetPasswordResponseSchema.parse({ message: 'User registered successfully' }));
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, rememberMe } = parseBody(LoginPayloadSchema, req.body);

    const user = await db.user.findUnique({
      where: { email: normalizeEmail(email) },
    });

    if (!user || !user.password) {
      throw new AppError('Invalid credentials', 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const { accessToken, refreshToken } = await issueSession(
      user.id,
      getRefreshTokenDays(rememberMe === true)
    );

    const authUser = AuthUserSchema.parse({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    });

    res.status(200).json(AuthResponseSchema.parse({
      user: authUser,
      accessToken,
      refreshToken,
    }));
  } catch (error) {
    next(error);
  }
};

export const googleOAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = parseBody(GoogleOAuthPayloadSchema, req.body);

    const verifyOptions = {
      idToken: token,
      ...(process.env.GOOGLE_CLIENT_ID ? { audience: process.env.GOOGLE_CLIENT_ID } : {}),
    };

    const ticket = await googleClient.verifyIdToken(verifyOptions);
    const payload = ticket.getPayload();

    if (!payload?.email || !payload.sub) {
      throw new AppError('Invalid Google token payload', 400);
    }

    const email = normalizeEmail(payload.email);
    const fullName = payload.name?.trim() || 'Google User';
    const avatarUrl = payload.picture ?? null;
    const providerAccountId = payload.sub;

    let user = await db.user.findUnique({ where: { email } });

    if (!user) {
      user = await db.user.create({
        data: {
          email,
          fullName,
          avatarUrl,
          oauthAccounts: {
            create: {
              provider: 'google',
              providerAccountId,
            },
          },
        },
      });
    } else {
      const linkedGoogleAccount = await db.oAuthAccount.findFirst({
        where: {
          userId: user.id,
          provider: 'google',
        },
      });

      if (!linkedGoogleAccount) {
        await db.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: 'google',
            providerAccountId,
          },
        });
      }
    }

    const { accessToken, refreshToken } = await issueSession(user.id, DEFAULT_REFRESH_TOKEN_DAYS);

    const authUser = AuthUserSchema.parse({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    });

    res.status(200).json(AuthResponseSchema.parse({
      user: authUser,
      accessToken,
      refreshToken,
    }));
  } catch (error) {
    next(error);
  }
};

export const githubOAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = parseBody(GitHubOAuthPayloadSchema, req.body);

    const tokenResponse = await axios.post<{ access_token?: string }>(
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

    const accessTokenFromGithub = tokenResponse.data.access_token;
    if (!accessTokenFromGithub) {
      throw new AppError('Invalid GitHub OAuth code', 400);
    }

    const [userResponse, emailResponse] = await Promise.all([
      axios.get<unknown>('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessTokenFromGithub}`,
        },
      }),
      axios.get<unknown>('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessTokenFromGithub}`,
        },
      }),
    ]);

    if (!isRecord(userResponse.data)) {
      throw new AppError('Unable to retrieve GitHub user profile', 400);
    }

    const githubId = userResponse.data.id;
    if (typeof githubId !== 'string' && typeof githubId !== 'number') {
      throw new AppError('Unable to retrieve GitHub account id', 400);
    }

    const emails = Array.isArray(emailResponse.data)
      ? emailResponse.data
          .filter(isRecord)
          .map((emailEntry) => ({
            email: typeof emailEntry.email === 'string' ? emailEntry.email : '',
            primary: emailEntry.primary === true,
            verified: emailEntry.verified === true,
          }))
          .filter((emailEntry) => emailEntry.email.length > 0)
      : [];

    const selectedEmail =
      emails.find((emailEntry) => emailEntry.primary && emailEntry.verified) ??
      emails.find((emailEntry) => emailEntry.primary) ??
      emails[0];

    if (!selectedEmail) {
      throw new AppError('Unable to get an email from GitHub', 400);
    }

    const fullName =
      (typeof userResponse.data.name === 'string' && userResponse.data.name.trim()) ||
      (typeof userResponse.data.login === 'string' && userResponse.data.login.trim()) ||
      'GitHub User';
    const avatarUrl = typeof userResponse.data.avatar_url === 'string' ? userResponse.data.avatar_url : null;
    const providerAccountId = String(githubId);
    const email = normalizeEmail(selectedEmail.email);

    let user = await db.user.findUnique({ where: { email } });

    if (!user) {
      user = await db.user.create({
        data: {
          email,
          fullName,
          avatarUrl,
          oauthAccounts: {
            create: {
              provider: 'github',
              providerAccountId,
              accessToken: accessTokenFromGithub,
            },
          },
        },
      });
    } else {
      const linkedGithubAccount = await db.oAuthAccount.findFirst({
        where: {
          userId: user.id,
          provider: 'github',
        },
      });

      if (!linkedGithubAccount) {
        await db.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: 'github',
            providerAccountId,
            accessToken: accessTokenFromGithub,
          },
        });
      }
    }

    const { accessToken, refreshToken } = await issueSession(user.id, DEFAULT_REFRESH_TOKEN_DAYS);

    const authUser = AuthUserSchema.parse({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    });

    res.status(200).json(AuthResponseSchema.parse({
      user: authUser,
      accessToken,
      refreshToken,
    }));
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken: providedToken } = parseBody(RefreshTokenPayloadSchema, req.body);

    const storedToken = await db.refreshToken.findUnique({
      where: { token: providedToken },
    });

    if (!storedToken) {
      throw new AppError('Invalid or expired token', 401);
    }

    if (storedToken.expiresAt.getTime() <= Date.now()) {
      await db.refreshToken.delete({ where: { id: storedToken.id } });
      throw new AppError('Invalid or expired token', 401);
    }

    let decoded: string | JwtPayload;
    try {
      decoded = jwt.verify(providedToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
    } catch {
      await db.refreshToken.delete({ where: { id: storedToken.id } });
      throw new AppError('Invalid or expired token', 401);
    }

    const userId = extractUserIdFromJwt(decoded);
    if (!userId) {
      await db.refreshToken.delete({ where: { id: storedToken.id } });
      throw new AppError('Invalid or expired token', 401);
    }

    const originalLifetimeMs = storedToken.expiresAt.getTime() - storedToken.createdAt.getTime();
    const defaultLifetimeMs = DEFAULT_REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000;
    const refreshTokenDays =
      originalLifetimeMs > defaultLifetimeMs
        ? REMEMBER_ME_REFRESH_TOKEN_DAYS
        : DEFAULT_REFRESH_TOKEN_DAYS;

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(userId);
    await db.$transaction([
      db.refreshToken.delete({ where: { id: storedToken.id } }),
      db.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId,
          expiresAt: new Date(Date.now() + refreshTokenDays * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    res.status(200).json(RefreshTokenResponseSchema.parse({
      accessToken,
      refreshToken: newRefreshToken,
    }));
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = parseBody(ForgotPasswordPayloadSchema, req.body);

    const normalizedEmail = normalizeEmail(email);
    const genericMessage = 'If an account exists, a reset link was sent.';
    const user = await db.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      res.status(200).json(ResetPasswordResponseSchema.parse({ message: genericMessage }));
      return;
    }

    await db.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    const token = randomBytes(32).toString('hex');
    await db.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
      },
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl.replace(/\/$/, '')}/reset-password?token=${token}`;
    logger.info(`[Auth] Password reset link for ${normalizedEmail}: ${resetUrl}`);

    res.status(200).json(ResetPasswordResponseSchema.parse({ message: genericMessage }));
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = parseBody(ResetPasswordPayloadSchema, req.body);

    const storedResetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (
      !storedResetToken ||
      storedResetToken.usedAt ||
      storedResetToken.expiresAt.getTime() <= Date.now()
    ) {
      throw new AppError('Invalid or expired token', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db.$transaction([
      db.user.update({
        where: { id: storedResetToken.userId },
        data: { password: passwordHash },
      }),
      db.passwordResetToken.update({
        where: { id: storedResetToken.id },
        data: { usedAt: new Date() },
      }),
      db.refreshToken.deleteMany({
        where: { userId: storedResetToken.userId },
      }),
    ]);

    res
      .status(200)
      .json(ResetPasswordResponseSchema.parse({ message: 'Password updated successfully' }));
  } catch (error) {
    next(error);
  }
};
