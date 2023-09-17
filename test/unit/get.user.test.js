import request from 'supertest';
import app from '../../app.js';

describe('GET /users', () => {
  // Using fragments array
  test('get users array', async () => {
    const res = await request(app).get('/users');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
