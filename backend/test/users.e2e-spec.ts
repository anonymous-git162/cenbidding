import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { initTestApp, closeTestApp, getHttpServer } from './test-app';
import { loginAs } from './test-helper';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let adminCookies: string;
  let procurementCookies: string;

  beforeAll(async () => {
    const testApp = await initTestApp();
    app = testApp.app;

    adminCookies = await loginAs(
      getHttpServer(),
      'admin@ebidding.com',
      'Password123',
    );
    procurementCookies = await loginAs(
      getHttpServer(),
      'procurement@ebidding.com',
      'Password123',
    );
  });

  afterAll(async () => {
    await closeTestApp();
  });

  const testEmail = `e2e-user-${Date.now()}@test.com`;
  let userId: string;

  it('should create a user (admin only)', async () => {
    const res = await request(getHttpServer())
      .post('/api/users')
      .set('Cookie', adminCookies)
      .send({
        email: testEmail,
        password: 'Password123',
        fullName: 'E2E User',
        role: 'REQUESTER',
      })
      .expect(201);

    userId = res.body.id;
    expect(res.body.email).toBe(testEmail);
    expect(res.body.role).toBe('REQUESTER');
  });

  it('should reject non-admin from creating users', async () => {
    await request(getHttpServer())
      .post('/api/users')
      .set('Cookie', procurementCookies)
      .send({
        email: `fail-${Date.now()}@test.com`,
        password: 'Password123',
        fullName: 'Fail',
        role: 'REQUESTER',
      })
      .expect(403);
  });

  it('should list users', async () => {
    const res = await request(getHttpServer())
      .get('/api/users')
      .set('Cookie', adminCookies)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((u: any) => u.email === testEmail)).toBe(true);
  });

  it('should get user by ID', async () => {
    const res = await request(getHttpServer())
      .get(`/api/users/${userId}`)
      .set('Cookie', adminCookies)
      .expect(200);

    expect(res.body.email).toBe(testEmail);
  });

  it('should update user', async () => {
    const res = await request(getHttpServer())
      .patch(`/api/users/${userId}`)
      .set('Cookie', adminCookies)
      .send({ fullName: 'Updated E2E User' })
      .expect(200);

    expect(res.body.fullName).toBe('Updated E2E User');
  });

  it('should reset user password', async () => {
    const res = await request(getHttpServer())
      .post(`/api/users/${userId}/reset-password`)
      .set('Cookie', adminCookies)
      .send({ password: 'NewPass789' })
      .expect(201);

    expect(res.body).toBeDefined();
  });

  it('should unlock user', async () => {
    const res = await request(getHttpServer())
      .post(`/api/users/${userId}/unlock`)
      .set('Cookie', adminCookies)
      .expect(201);

    expect(res.body).toBeDefined();
  });

  it('should deactivate (delete) user', async () => {
    const res = await request(getHttpServer())
      .delete(`/api/users/${userId}`)
      .set('Cookie', adminCookies)
      .expect(200);

    expect(res.body.id).toBe(userId);
  });

  it('should reject unauthenticated access', async () => {
    await request(getHttpServer()).get('/api/users').expect(401);
  });
});
