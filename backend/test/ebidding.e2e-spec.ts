import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  initTestApp,
  closeTestApp,
  getHttpServer,
  getPrismaClient,
} from './test-app';
import { loginAs } from './test-helper';

describe('E-Bidding Lifecycle (e2e)', () => {
  let app: INestApplication;
  let requesterCookies: string;
  let procurementCookies: string;
  let vendorCookies: string;
  let vendor2Cookies: string;
  let prisma: ReturnType<typeof getPrismaClient>;
  let procurementId: string;
  let roundId: string;
  let vendorId: string;
  let vendor2Id: string;

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
    vendorCookies = await loginAs(
      getHttpServer(),
      'vendor@ebidding.com',
      'Password123',
    );
    vendor2Cookies = await loginAs(
      getHttpServer(),
      'vendor2@ebidding.com',
      'Password123',
    );

    const seedVendor = await prisma.vendor.findFirst({
      where: { contactEmail: 'vendor@ebidding.com' },
    });
    const seedVendor2 = await prisma.vendor.findFirst({
      where: { contactEmail: 'vendor2@ebidding.com' },
    });
    vendorId = seedVendor!.id;
    vendor2Id = seedVendor2!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  it('should create a procurement in DRAFT', async () => {
    const res = await request(getHttpServer())
      .post('/api/procurements')
      .set('Cookie', requesterCookies)
      .send({
        requestType: 'RFP',
        title: `E-Bidding E2E Test ${Date.now()}`,
        description: 'Testing full bidding lifecycle',
        budgetEstimate: 1000000,
      })
      .expect(201);

    procurementId = res.body.id;
    expect(res.body.status).toBe('DRAFT');
  });

  it('should transition through workflow to APPROVED', async () => {
    await request(getHttpServer())
      .post(`/api/procurements/${procurementId}/submit`)
      .set('Cookie', requesterCookies)
      .expect(201);

    await request(getHttpServer())
      .post(`/api/procurements/${procurementId}/review/start`)
      .set('Cookie', procurementCookies)
      .expect(201);

    const res = await request(getHttpServer())
      .post(`/api/procurements/${procurementId}/review/approve`)
      .set('Cookie', procurementCookies)
      .send({ comment: 'Approved for bidding' })
      .expect(201);

    expect(res.body.status).toBe('APPROVED');
  });

  it('should publish the procurement', async () => {
    const futureDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const res = await request(getHttpServer())
      .post(`/api/procurements/${procurementId}/publish`)
      .set('Cookie', procurementCookies)
      .send({ submissionDeadline: futureDate })
      .expect(201);

    expect(res.body.status).toBe('RFP_PUBLISHED');
  });

  it('should invite vendors and accept invitations', async () => {
    await prisma.vendorInvitation.create({
      data: { procurementId, vendorId, invitationStatus: 'ACCEPTED' },
    });
    await prisma.vendorInvitation.create({
      data: {
        procurementId,
        vendorId: vendor2Id,
        invitationStatus: 'ACCEPTED',
      },
    });

    const countRes = await request(getHttpServer())
      .get(`/api/ebidding/vendor-count/${procurementId}`)
      .set('Cookie', procurementCookies)
      .expect(200);

    expect(countRes.body.count).toBe(2);
    expect(countRes.body.hasEnough).toBe(true);
  });

  it('should get accepted vendor count', async () => {
    const res = await request(getHttpServer())
      .get(`/api/ebidding/vendor-count/${procurementId}`)
      .set('Cookie', procurementCookies)
      .expect(200);

    expect(res.body).toHaveProperty('count');
  });

  it('should create a bidding round', async () => {
    const res = await request(getHttpServer())
      .post('/api/ebidding/rounds')
      .set('Cookie', procurementCookies)
      .send({ procurementId })
      .expect(201);

    roundId = res.body.id;
    expect(res.body.status).toBe('PENDING');
  });

  it('should open the bidding round', async () => {
    const res = await request(getHttpServer())
      .post(`/api/ebidding/rounds/${roundId}/open`)
      .set('Cookie', procurementCookies)
      .expect(201);

    expect(res.body.status).toBe('OPEN');
  });

  it('should get rounds for the procurement', async () => {
    const res = await request(getHttpServer())
      .get(`/api/ebidding/rounds/procurement/${procurementId}`)
      .set('Cookie', procurementCookies)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('should allow vendor to place a bid', async () => {
    const res = await request(getHttpServer())
      .post('/api/ebidding/bid')
      .set('Cookie', vendorCookies)
      .send({ roundId, bidAmount: 850000 })
      .expect(201);

    expect(Number(res.body.bidAmount)).toBe(850000);
  });

  it('should allow second vendor to place a bid', async () => {
    const res = await request(getHttpServer())
      .post('/api/ebidding/bid')
      .set('Cookie', vendor2Cookies)
      .send({ roundId, bidAmount: 820000 })
      .expect(201);

    expect(Number(res.body.bidAmount)).toBe(820000);
  });

  it('should get all bids for the round (procurement view)', async () => {
    const res = await request(getHttpServer())
      .get(`/api/ebidding/rounds/${roundId}/bids`)
      .set('Cookie', procurementCookies)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  it('should get my bids for the round (vendor view)', async () => {
    const res = await request(getHttpServer())
      .get(`/api/ebidding/rounds/${roundId}/my-bids`)
      .set('Cookie', vendorCookies)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should get all my bids across all rounds', async () => {
    const res = await request(getHttpServer())
      .get('/api/ebidding/my-bids')
      .set('Cookie', vendorCookies)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should allow vendor to delete their bid while round is open', async () => {
    const res = await request(getHttpServer())
      .get(`/api/ebidding/rounds/${roundId}/my-bids`)
      .set('Cookie', vendorCookies)
      .expect(200);

    const myBid = res.body[0];
    if (myBid) {
      await request(getHttpServer())
        .delete(`/api/ebidding/bids/${myBid.id}`)
        .set('Cookie', vendorCookies)
        .expect(200);
    }
  });

  it('should close the bidding round', async () => {
    const res = await request(getHttpServer())
      .post(`/api/ebidding/rounds/${roundId}/close`)
      .set('Cookie', procurementCookies)
      .expect(201);

    expect(res.body.status).toBe('CLOSED');
  });
});
