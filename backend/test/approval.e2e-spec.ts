import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  initTestApp,
  closeTestApp,
  getHttpServer,
  getPrismaClient,
} from './test-app';
import { loginAs } from './test-helper';

describe('Approval Lifecycle (e2e)', () => {
  let app: INestApplication;
  let requesterCookies: string;
  let procurementCookies: string;
  let approverCookies: string;
  let prisma: ReturnType<typeof getPrismaClient>;
  let approvalId: string;
  let requesterId: string;

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
    approverCookies = await loginAs(
      getHttpServer(),
      'approver@ebidding.com',
      'Password123',
    );

    const requesterUser = await prisma.user.findUnique({
      where: { email: 'requester@ebidding.com' },
    });
    requesterId = requesterUser!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  it('should create and submit a procurement for approval', async () => {
    const createRes = await request(getHttpServer())
      .post('/api/procurements')
      .set('Cookie', requesterCookies)
      .send({
        requestType: 'RFP',
        title: `Approval E2E Test ${Date.now()}`,
        description: 'Testing approval lifecycle',
        budgetEstimate: 50000,
      })
      .expect(201);

    const procurementId = createRes.body.id;

    const submitRes = await request(getHttpServer())
      .post(`/api/procurements/${procurementId}/submit`)
      .set('Cookie', requesterCookies)
      .expect(201);

    expect(submitRes.body.status).toBe('SUBMITTED');
  });

  it('should get approval inbox for procurement officer', async () => {
    const res = await request(getHttpServer())
      .get('/api/approval/inbox')
      .set('Cookie', approverCookies)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should start review of a submitted procurement', async () => {
    const createRes = await request(getHttpServer())
      .post('/api/procurements')
      .set('Cookie', requesterCookies)
      .send({
        requestType: 'RFP',
        title: `Approval Route Test ${Date.now()}`,
        description: 'Testing approval routing',
        budgetEstimate: 75000,
      })
      .expect(201);

    const pId = createRes.body.id;

    await request(getHttpServer())
      .post(`/api/procurements/${pId}/submit`)
      .set('Cookie', requesterCookies)
      .expect(201);

    const startRes = await request(getHttpServer())
      .post(`/api/procurements/${pId}/review/start`)
      .set('Cookie', procurementCookies)
      .expect(201);

    expect(startRes.body.status).toBe('UNDER_PROCUREMENT_REVIEW');
    approvalId = pId;
  });

  it('should return procurement for revision', async () => {
    const createRes = await request(getHttpServer())
      .post('/api/procurements')
      .set('Cookie', requesterCookies)
      .send({
        requestType: 'RFP',
        title: `Approval Return Test ${Date.now()}`,
        description: 'Testing return flow',
        budgetEstimate: 30000,
      })
      .expect(201);

    const pId = createRes.body.id;

    await request(getHttpServer())
      .post(`/api/procurements/${pId}/submit`)
      .set('Cookie', requesterCookies)
      .expect(201);

    await request(getHttpServer())
      .post(`/api/procurements/${pId}/review/start`)
      .set('Cookie', procurementCookies)
      .expect(201);

    const returnRes = await request(getHttpServer())
      .post(`/api/procurements/${pId}/review/return`)
      .set('Cookie', procurementCookies)
      .send({ reason: 'Please update budget' })
      .expect(201);

    expect(returnRes.body.status).toBe('RETURNED_FOR_REVISION');
  });

  it('should approve procurement review', async () => {
    const createRes = await request(getHttpServer())
      .post('/api/procurements')
      .set('Cookie', requesterCookies)
      .send({
        requestType: 'RFP',
        title: `Approval Approve Test ${Date.now()}`,
        description: 'Testing approve flow',
        budgetEstimate: 90000,
      })
      .expect(201);

    const pId = createRes.body.id;

    await request(getHttpServer())
      .post(`/api/procurements/${pId}/submit`)
      .set('Cookie', requesterCookies)
      .expect(201);

    await request(getHttpServer())
      .post(`/api/procurements/${pId}/review/start`)
      .set('Cookie', procurementCookies)
      .expect(201);

    const approveRes = await request(getHttpServer())
      .post(`/api/procurements/${pId}/review/approve`)
      .set('Cookie', procurementCookies)
      .send({ comment: 'Approved' })
      .expect(201);

    expect(approveRes.body.status).toBe('APPROVED');
  });

  it('should reject approval without auth', async () => {
    await request(getHttpServer()).get('/api/approval/inbox').expect(401);
  });
});
