import request from 'supertest';
import { app } from '../index.js';
import { clearDatabase } from './setup.js';
import db from '../utils/db.js';

async function getAuthToken(email: string = 'user@example.com') {
  await request(app)
    .post('/api/v1/auth/register')
    .send({
      email,
      password: 'Password123!',
      fullName: 'Auth User',
    });

  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email,
      password: 'Password123!',
    });

  return response.body.accessToken;
}

describe('User Domain', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('GET /api/v1/users/me', () => {
    it('should return current user profile', async () => {
      const token = await getAuthToken();

      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('user@example.com');
      expect(response.body.fullName).toBe('Auth User');
    });

    it('should fail without token', async () => {
      const response = await request(app).get('/api/v1/users/me');
      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/users/me/profile', () => {
    it('should update profile successfully', async () => {
      const token = await getAuthToken();

      const response = await request(app)
        .patch('/api/v1/users/me/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ fullName: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.fullName).toBe('Updated Name');
    });
  });

  describe('PATCH /api/v1/users/me/preferences', () => {
    it('should update preferences successfully', async () => {
      const token = await getAuthToken();

      const response = await request(app)
        .patch('/api/v1/users/me/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ emailNotifications: false });

      expect(response.status).toBe(200);
      expect(response.body.preferences.emailNotifications).toBe(false);
    });
  });

  describe('DELETE /api/v1/users/me', () => {
    it('should delete account successfully', async () => {
      const token = await getAuthToken('delete@example.com');

      const response = await request(app)
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'Password123!' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Account deleted successfully');

      const user = await db.user.findUnique({ where: { email: 'delete@example.com' } });
      expect(user).toBeNull();
    });
  });

  describe('PUT /api/v1/users/me/password', () => {
    it('should update password successfully', async () => {
      const email = 'pass@example.com';
      const token = await getAuthToken(email);

      const response = await request(app)
        .put('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword456!',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password updated successfully');

      // Verify login with new password
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email,
          password: 'NewPassword456!',
        });
      expect(loginRes.status).toBe(200);
    });
  });
});
