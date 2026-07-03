import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { initTestApp, closeTestApp, getHttpServer } from './test-app';
import { loginAs } from './test-helper';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let cookies: string;

  beforeAll(async () => {
    const testApp = await initTestApp();
    app = testApp.app;
    cookies = await loginAs(
      getHttpServer(),
      'requester@ebidding.com',
      'Password123',
    );
  });

  afterAll(async () => {
    await closeTestApp();
  });

  it('GET /api/procurements/currencies should return 200 with auth', async () => {
    await request(getHttpServer())
      .get('/api/procurements/currencies')
      .set('Cookie', cookies)
      .expect(200);
  });
});
