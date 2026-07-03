import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { initTestApp, closeTestApp, getHttpServer } from './test-app';
import { loginAs } from './test-helper';
import * as path from 'path';

describe('Files (e2e)', () => {
  let app: INestApplication;
  let requesterCookies: string;

  beforeAll(async () => {
    const testApp = await initTestApp();
    app = testApp.app;

    requesterCookies = await loginAs(
      getHttpServer(),
      'requester@ebidding.com',
      'Password123',
    );
  });

  afterAll(async () => {
    await closeTestApp();
  });

  let fileId: string;

  it('should upload a PDF file', async () => {
    const buf = Buffer.from('%PDF-1.4 test content', 'utf-8');
    const res = await request(getHttpServer())
      .post('/api/files/upload')
      .set('Cookie', requesterCookies)
      .attach('file', buf, 'test.pdf')
      .expect(201);

    fileId = res.body.id;
    expect(res.body.fileName).toBe('test.pdf');
    expect(res.body.mimeType).toBe('application/pdf');
  });

  it('should reject file with wrong magic bytes', async () => {
    const buf = Buffer.from('This is not a real PDF file at all', 'utf-8');
    await request(getHttpServer())
      .post('/api/files/upload')
      .set('Cookie', requesterCookies)
      .attach('file', buf, 'fake.pdf')
      .expect(400);
  });

  it('should reject disallowed file type', async () => {
    const buf = Buffer.from('<html></html>', 'utf-8');
    await request(getHttpServer())
      .post('/api/files/upload')
      .set('Cookie', requesterCookies)
      .attach('file', buf, 'test.html')
      .expect(400);
  });

  it('should list files', async () => {
    const res = await request(getHttpServer())
      .get('/api/files')
      .set('Cookie', requesterCookies)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((f: any) => f.id === fileId)).toBe(true);
  });

  it('should download a file', async () => {
    await request(getHttpServer())
      .get(`/api/files/${fileId}`)
      .set('Cookie', requesterCookies)
      .expect(200);
  });

  it('should delete a file', async () => {
    const res = await request(getHttpServer())
      .delete(`/api/files/${fileId}`)
      .set('Cookie', requesterCookies)
      .expect(200);

    expect(res.body.message).toBe('File deleted');
  });

  it('should reject unauthenticated upload', async () => {
    const buf = Buffer.from('%PDF-1.4 test', 'utf-8');
    await request(getHttpServer())
      .post('/api/files/upload')
      .attach('file', buf, 'test.pdf')
      .expect(401);
  });
});
