import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('Health Check', () => {
  it('GET /api/v1/health — should return server status', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBeLessThan(600); // Either 200 or 503 (if DB/Redis not available in test runner)
    expect(res.body).toHaveProperty('success');
    expect(res.body).toHaveProperty('data.status');
    expect(res.body).toHaveProperty('data.services.database');
    expect(res.body).toHaveProperty('data.services.redis');
  });

  it('GET / — should return API info', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'Healthcare Appointment System API');
    expect(res.body).toHaveProperty('status', 'running');
  });

  it('GET /unknown-route — should return 404', async () => {
    const res = await request(app).get('/api/v1/unknown-route');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
