import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  initTestApp,
  closeTestApp,
  getHttpServer,
  getPrismaClient,
} from './test-app';
import { loginAs } from './test-helper';

describe('Evaluation Lifecycle (e2e)', () => {
  let app: INestApplication;
  let requesterCookies: string;
  let procurementCookies: string;
  let evaluatorCookies: string;
  let leadCookies: string;
  let prisma: ReturnType<typeof getPrismaClient>;
  let procurementId: string;
  let requesterId: string;
  let evaluatorId: string;
  let leadId: string;
  let vendorIdForReview: string;

  beforeAll(async () => {
    const testApp = await initTestApp();
    app = testApp.app;
    prisma = getPrismaClient();

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
    evaluatorCookies = await loginAs(
      getHttpServer(),
      'evaluator@ebidding.com',
      'Password123',
    );
    leadCookies = await loginAs(
      getHttpServer(),
      'lead@ebidding.com',
      'Password123',
    );

    const evaluatorUser = await prisma.user.findUnique({
      where: { email: 'evaluator@ebidding.com' },
    });
    const leadUser = await prisma.user.findUnique({
      where: { email: 'lead@ebidding.com' },
    });
    const requesterUser = await prisma.user.findUnique({
      where: { email: 'requester@ebidding.com' },
    });
    evaluatorId = evaluatorUser!.id;
    leadId = leadUser!.id;
    requesterId = requesterUser!.id;

    const seedVendor = await prisma.vendor.findFirst({
      where: { contactEmail: 'vendor@ebidding.com' },
    });
    vendorIdForReview = seedVendor!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  it('should create and advance procurement to RFP_PUBLISHED', async () => {
    const createRes = await request(getHttpServer())
      .post('/api/procurements')
      .set('Cookie', requesterCookies)
      .send({
        requestType: 'RFP',
        title: `Evaluation E2E Test ${Date.now()}`,
        description: 'Testing evaluation lifecycle',
        budgetEstimate: 100000,
      })
      .expect(201);

    procurementId = createRes.body.id;

    await request(getHttpServer())
      .post(`/api/procurements/${procurementId}/submit`)
      .set('Cookie', requesterCookies)
      .expect(201);

    await request(getHttpServer())
      .post(`/api/procurements/${procurementId}/review/start`)
      .set('Cookie', procurementCookies)
      .expect(201);

    await request(getHttpServer())
      .post(`/api/procurements/${procurementId}/review/approve`)
      .set('Cookie', procurementCookies)
      .send({ comment: 'Approved' })
      .expect(201);

    const futureDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const publishRes = await request(getHttpServer())
      .post(`/api/procurements/${procurementId}/publish`)
      .set('Cookie', procurementCookies)
      .send({ submissionDeadline: futureDate })
      .expect(201);

    expect(publishRes.body.status).toBe('RFP_PUBLISHED');
  });

  it('should assign evaluators', async () => {
    const res = await request(getHttpServer())
      .post('/api/evaluation/assignments')
      .set('Cookie', procurementCookies)
      .send({
        procurementId,
        evaluatorIds: [evaluatorId],
        leadEvaluatorId: leadId,
      })
      .expect(201);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0]).toHaveProperty('procurementId', procurementId);
  });

  it('should get my assignments as evaluator', async () => {
    const res = await request(getHttpServer())
      .get('/api/evaluation/assignments')
      .set('Cookie', evaluatorCookies)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should submit a review as evaluator', async () => {
    const res = await request(getHttpServer())
      .post('/api/evaluation/reviews')
      .set('Cookie', evaluatorCookies)
      .send({
        procurementId,
        vendorId: vendorIdForReview,
        score: 85,
        comment: 'Good proposal',
      })
      .expect(201);

    expect(res.body.score).toBe(85);
  });

  it('should get reviews for procurement', async () => {
    const res = await request(getHttpServer())
      .get(`/api/evaluation/reviews/${procurementId}`)
      .set('Cookie', procurementCookies)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should calculate scores', async () => {
    const res = await request(getHttpServer())
      .post(`/api/evaluation/calculate/${procurementId}`)
      .set('Cookie', leadCookies)
      .expect(201);

    expect(res.body).toBeDefined();
    expect(Object.keys(res.body).length).toBeGreaterThanOrEqual(1);
    expect(res.body[vendorIdForReview]).toHaveProperty('avgScore');
  });

  it('should consolidate evaluation', async () => {
    const res = await request(getHttpServer())
      .post(`/api/evaluation/consolidate/${procurementId}`)
      .set('Cookie', leadCookies)
      .send({
        recommendation: 'Vendor A recommended',
        leadCommentary: 'Strong technical proposal',
      })
      .expect(201);

    expect(res.body.recommendation).toBe('Vendor A recommended');
  });

  it('should get consolidation', async () => {
    const res = await request(getHttpServer())
      .get(`/api/evaluation/consolidation/${procurementId}`)
      .set('Cookie', procurementCookies)
      .expect(200);

    expect(res.body.recommendation).toBe('Vendor A recommended');
  });
});
