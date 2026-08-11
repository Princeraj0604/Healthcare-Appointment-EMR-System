import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('Auth Endpoints Integration Tests', () => {
  it('POST /api/v1/auth/register — should reject weak passwords with 422', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test Patient',
      email: 'patient@test.com',
      password: 'weak', // Fails min 8 chars + special char rules
      role: 'PATIENT',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('POST /api/v1/auth/login — should reject missing credentials with 422', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'invalid-email',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});
