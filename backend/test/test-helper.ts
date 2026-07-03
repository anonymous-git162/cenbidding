import request from 'supertest';

export function getCookies(res: request.Response): string {
  const cookies = res.headers['set-cookie'];
  if (!cookies) return '';
  const arr = Array.isArray(cookies) ? cookies : [cookies];
  return arr.map((c) => c.split(';')[0]).join('; ');
}

export async function loginAs(
  httpServer: any,
  email: string,
  password: string,
): Promise<string> {
  const res = await request(httpServer)
    .post('/api/auth/login')
    .send({ email, password });
  return getCookies(res);
}
