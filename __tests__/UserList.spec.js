import { describe, expect, test, jest } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';

describe('Users list', () => {
  it('returns 200 ok when there are no user in the db', async () => {
    const res = await request(app).get('/api/1.0/users');

    expect(res.status).toBe(200);
  });

  it('returns page object as res body', async () => {
    const res = await request(app).get('/api/1.0/users');

    expect(res.body).toEqual({
      content: [],
      page: 0,
      size: 10,
      totalPages: 0,
    });
  });
});
