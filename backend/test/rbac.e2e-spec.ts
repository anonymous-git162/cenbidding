import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { initTestApp, closeTestApp, getHttpServer } from './test-app';
import { loginAs } from './test-helper';

describe('RBAC (e2e)', () => {
  let app: INestApplication;
  let requesterCookies: string;
  let procurementCookies: string;
  let adminCookies: string;
  let vendorCookies: string;

  beforeAll(async () => {
    const testApp = await initTestApp();
    app = testApp.app;

    requesterCookies = await loginAs(
      getHttpServer(),
      'requester@ebidding.com',
      'Password123',
    );
    procurementCookies = await loginAs(
      getHttpServer(),
      'procurement@ebidding.com',
      'Password123',
    );
    adminCookies = await loginAs(
      getHttpServer(),
      'admin@ebidding.com',
      'Password123',
    );
    vendorCookies = await loginAs(
      getHttpServer(),
      'vendor@ebidding.com',
      'Password123',
    );
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /api/procurements (create)', () => {
    const createPayload = {
      requestType: 'RFP',
      title: 'RBAC Test Procurement',
      description: 'For RBAC testing',
      budgetEstimate: 100000,
    };

    it('should allow REQUESTER to create procurement', async () => {
      const res = await request(getHttpServer())
        .post('/api/procurements')
        .set('Cookie', requesterCookies)
        .send(createPayload)
        .expect(201);

      expect(res.body.status).toBe('DRAFT');
    });

    it('should allow PROCUREMENT to create procurement', async () => {
      await request(getHttpServer())
        .post('/api/procurements')
        .set('Cookie', procurementCookies)
        .send(createPayload)
        .expect(201);
    });

    it('should allow ADMIN to create procurement', async () => {
      await request(getHttpServer())
        .post('/api/procurements')
        .set('Cookie', adminCookies)
        .send(createPayload)
        .expect(201);
    });

    it('should reject VENDOR from creating procurement', async () => {
      await request(getHttpServer())
        .post('/api/procurements')
        .set('Cookie', vendorCookies)
        .send(createPayload)
        .expect(403);
    });
  });

  describe('GET /api/procurements', () => {
    it('should allow all roles to list procurements', async () => {
      await request(getHttpServer())
        .get('/api/procurements')
        .set('Cookie', requesterCookies)
        .expect(200);

      await request(getHttpServer())
        .get('/api/procurements')
        .set('Cookie', vendorCookies)
        .expect(200);
    });

    it('should reject unauthenticated requests', async () => {
      await request(getHttpServer()).get('/api/procurements').expect(401);
    });
  });

  describe('Admin-only endpoints', () => {
    it('should reject non-ADMIN from accessing /api/procurements/stats', async () => {
      await request(getHttpServer())
        .get('/api/procurements/stats')
        .set('Cookie', requesterCookies)
        .expect(403);
    });

    it('should allow ADMIN to access stats', async () => {
      await request(getHttpServer())
        .get('/api/procurements/stats')
        .set('Cookie', adminCookies)
        .expect(200);
    });
  });

  describe('Unauthenticated access', () => {
    it('should allow unauthenticated registration', async () => {
      await request(getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `e2e-rbac-${Date.now()}@test.com`,
          password: 'TestPass123',
          fullName: 'RBAC Test',
        })
        .expect(201);
    });

    it('should reject unauthenticated access to procurements', async () => {
      await request(getHttpServer()).get('/api/procurements').expect(401);
    });
  });
});
