import { describe, expect, test, jest } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';
import User from '../src/models/Users.js';

import sequelize from '../src/config/db.js';
import bcrypt from 'bcrypt';

beforeAll(async () => {
  await sequelize.sync();
});

beforeEach(async () => {
  await User.destroy({ truncate: true });
});

const addUser = async () => {
  const user = {
    username: 'user1',
    email: 'user1@mail.io',
    password: 'pjfqig7è9Kpmfd',
  };

  const hash = await bcrypt.hash(user.password, 10);
  user.password = hash;
  return await User.create(user);
};

const postAuth = async (credentials) => {
  return await request(app).post('/api/1.0/auth').send(credentials);
};

describe('Authentication', () => {
  it('returns 200 when credentials are correct', async () => {
    await addUser();

    const res = await postAuth({
      email: 'user1@mail.io',
      password: 'pjfqig7è9Kpmfd',
    });

    expect(res.status).toBe(200);
  });

  it('returns only user id and username when login is successful', async () => {
    const user = await addUser();
    const res = await postAuth({
      email: 'user1@mail.io',
      password: 'pjfqig7è9Kpmfd',
    });

    expect(res.body.id).toBe(user.id);
    expect(res.body.username).toBe(user.username);
    expect(Object.keys(res.body)).toEqual(['id', 'username']);
  });
});
