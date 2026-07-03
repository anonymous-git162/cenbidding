import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { initTestApp, closeTestApp, getHttpServer } from './test-app';
import { loginAs } from './test-helper';

describe('Notifications (e2e)', () => {
  let app: INestApplication;
  let cookies: string;

  beforeAll(async () => {
    const testApp = await initTestApp();
    app = testApp.app;
    cookies = await loginAs(getHttpServer(), 'admin@ebidding.com', 'Password123');
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('GET /api/notifications', () => {
    it('should return notifications for authenticated user', async () => {
      const res = await request(getHttpServer())
        .get('/api/notifications')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth', async () => {
      const res = await request(getHttpServer())
        .get('/api/notifications');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should return unread count', async () => {
      const res = await request(getHttpServer())
        .get('/api/notifications/unread-count')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.text).toMatch(/^\d+$/);
    });
  });

  describe('POST /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const res = await request(getHttpServer())
        .post('/api/notifications/read-all')
        .set('Cookie', cookies);

      expect(res.status).toBe(201);
    });
  });
});
