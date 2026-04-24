import request from 'supertest';
import { app } from '../index.js';
import { clearDatabase } from './setup.js';
import db from '../utils/db.js';

describe('Auth Domain', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          fullName: 'Test User',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');

      const user = await db.user.findUnique({ where: { email: 'test@example.com' } });
      expect(user).toBeTruthy();
      expect(user?.fullName).toBe('Test User');
    });

    it('should fail if email is already in use', async () => {
      await db.user.create({
        data: {
          email: 'test@example.com',
          fullName: 'Existing User',
        },
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          fullName: 'Test User',
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Email already in use');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      // Register first (or create via DB)
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          fullName: 'Test User',
        });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeTruthy();
      expect(response.body.refreshToken).toBeTruthy();
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    it('should issue a new access token', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          fullName: 'Test User',
        });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      const refreshToken = loginRes.body.refreshToken;

      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeTruthy();
      expect(response.body.refreshToken).toBeTruthy();
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should send a password reset link', async () => {
      await db.user.create({
        data: {
          email: 'reset@example.com',
          fullName: 'Reset User',
          password: 'Password123!',
        },
      });

      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'reset@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('reset link was sent');

      const token = await db.passwordResetToken.findFirst({
        where: { user: { email: 'reset@example.com' } },
      });
      expect(token).toBeTruthy();
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('should reset password with a valid token', async () => {
      const user = await db.user.create({
        data: {
          email: 'reset2@example.com',
          fullName: 'Reset User 2',
          password: 'OldPassword123!',
        },
      });

      const resetToken = 'valid-token';
      await db.passwordResetToken.create({
        data: {
          token: resetToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password updated successfully');

      // Verify login with new password
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'reset2@example.com',
          password: 'NewPassword123!',
        });
      expect(loginRes.status).toBe(200);
    });
  });
});
