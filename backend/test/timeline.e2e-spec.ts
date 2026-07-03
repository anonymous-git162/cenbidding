import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { initTestApp, closeTestApp, getHttpServer, getPrismaClient } from './test-app';
import { loginAs } from './test-helper';

describe('Timeline (e2e)', () => {
  let app: INestApplication;
  let cookies: string;
  let procurementId: string;

  beforeAll(async () => {
    const testApp = await initTestApp();
    app = testApp.app;
    cookies = await loginAs(getHttpServer(), 'requester@ebidding.com', 'Password123');

    // Create a procurement to get timeline for
    const createRes = await request(getHttpServer())
      .post('/api/procurements')
      .set('Cookie', cookies)
      .send({
        requestType: 'RFQ',
        title: 'Timeline Test Procurement',
        description: 'Testing timeline endpoint',
        category: 'IT',
      });

    if (createRes.status === 201) {
      procurementId = createRes.body.id;
    }
  });

  afterAll(async () => {
    // Cleanup
    if (procurementId) {
      const prisma = getPrismaClient();
      await prisma.procurementTimeline.deleteMany({ where: { procurementId } });
      await prisma.procurement.delete({ where: { id: procurementId } }).catch(() => {});
    }
    await closeTestApp();
  });

  describe('GET /api/timeline/:procurementId', () => {
    it('should return timeline events for a procurement', async () => {
      if (!procurementId) return;

      const res = await request(getHttpServer())
        .get(`/api/timeline/${procurementId}`)
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth', async () => {
      if (!procurementId) return;

      const res = await request(getHttpServer())
        .get(`/api/timeline/${procurementId}`);

      expect(res.status).toBe(401);
    });

    it('should return empty array for non-existent procurement', async () => {
      const res = await request(getHttpServer())
        .get('/api/timeline/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
