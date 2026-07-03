import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { initTestApp, closeTestApp, getHttpServer } from './test-app';
import { loginAs } from './test-helper';

describe('Vendors (e2e)', () => {
  let app: INestApplication;
  let adminCookies: string;

  beforeAll(async () => {
    const testApp = await initTestApp();
    app = testApp.app;

    adminCookies = await loginAs(
      getHttpServer(),
      'admin@ebidding.com',
      'Password123',
    );
  });

  afterAll(async () => {
    await closeTestApp();
  });

  const ts = Date.now();
  let vendorId: string;

  it('should create a vendor', async () => {
    const res = await request(getHttpServer())
      .post('/api/vendors')
      .set('Cookie', adminCookies)
      .send({
        companyName: `E2E Corp ${ts}`,
        taxId: `${ts}`.slice(0, 13),
        contactName: 'E2E Contact',
        contactEmail: `vendor-${ts}@test.com`,
        phone: '+66-2-999-9999',
        address: '123 E2E Street',
      })
      .expect(201);

    vendorId = res.body.id;
    expect(res.body.companyName).toBe(`E2E Corp ${ts}`);
    expect(res.body.status).toBe('ACTIVE');
  });

  it('should list vendors', async () => {
    const res = await request(getHttpServer())
      .get('/api/vendors')
      .set('Cookie', adminCookies)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((v: any) => v.id === vendorId)).toBe(true);
  });

  it('should get vendor by ID', async () => {
    const res = await request(getHttpServer())
      .get(`/api/vendors/${vendorId}`)
      .set('Cookie', adminCookies)
      .expect(200);

    expect(res.body.id).toBe(vendorId);
  });

  it('should update vendor', async () => {
    const res = await request(getHttpServer())
      .patch(`/api/vendors/${vendorId}`)
      .set('Cookie', adminCookies)
      .send({ companyName: `Updated E2E Corp ${ts}` })
      .expect(200);

    expect(res.body.companyName).toBe(`Updated E2E Corp ${ts}`);
  });

  it('should soft-delete vendor', async () => {
    const res = await request(getHttpServer())
      .delete(`/api/vendors/${vendorId}`)
      .set('Cookie', adminCookies)
      .expect(200);

    expect(res.body.status).toBe('INACTIVE');
  });

  it('should reject unauthenticated access', async () => {
    await request(getHttpServer()).get('/api/vendors').expect(401);
  });
});
