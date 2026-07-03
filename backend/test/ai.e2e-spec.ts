import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { initTestApp, closeTestApp, getHttpServer } from './test-app';
import { loginAs } from './test-helper';

describe('AI Service (e2e)', () => {
  let app: INestApplication;
  let cookies: string;

  beforeAll(async () => {
    const testApp = await initTestApp();
    app = testApp.app;
    cookies = await loginAs(getHttpServer(), 'requester@ebidding.com', 'Password123');
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /api/ai/write-tor', () => {
    it('should generate TOR or return template fallback', async () => {
      const res = await request(getHttpServer())
        .post('/api/ai/write-tor')
        .set('Cookie', cookies)
        .send({
          requestType: 'RFQ',
          category: 'IT',
          title: 'Test TOR Generation',
          description: 'Testing AI TOR generation endpoint',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('tor');
      expect(typeof res.body.tor).toBe('string');
      expect(res.body.tor.length).toBeGreaterThan(0);
    });

    it('should return 401 without auth', async () => {
      const res = await request(getHttpServer())
        .post('/api/ai/write-tor')
        .send({
          requestType: 'RFQ',
          category: 'IT',
          title: 'Test',
          description: 'Test',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/ai/score-vendor', () => {
    it('should score vendor or return fallback', async () => {
      const res = await request(getHttpServer())
        .post('/api/ai/score-vendor')
        .set('Cookie', cookies)
        .send({
          vendorName: 'Test Vendor',
          price: 50000,
          proposalText: 'Test proposal',
          allVendorPrices: [45000, 55000, 50000],
          procurementTitle: 'Test Procurement',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('score');
      expect(res.body).toHaveProperty('reasoning');
      expect(res.body).toHaveProperty('breakdown');
      expect(res.body.score).toBeGreaterThanOrEqual(0);
      expect(res.body.score).toBeLessThanOrEqual(100);
    });
  });
});
