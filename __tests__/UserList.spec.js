import { describe, expect, test, jest } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';
import User from '../src/models/Users.js';

import sequelize from '../src/config/db.js';

beforeAll(async () => {
  await sequelize.sync({ alter: true });
});

beforeEach(() => {
  return User.destroy({ truncate: true });
});

const getUsers = () => {
  return request(app).get('/api/1.0/users');
};

const addUsers = async (activeUsersCount, inactiveUsersCount = 0) => {
  for (let i = 0; i < activeUsersCount + inactiveUsersCount; i++) {
    await User.create({
      username: `user${i + 1}`,
      email: `user${i + 1}@email.io`,
      inactive: i >= activeUsersCount,
    });
  }
};

describe('Users list', () => {
  it('returns 200 ok when there are no user in the db', async () => {
    const res = await getUsers();

    expect(res.status).toBe(200);
  });

  it('returns page object as res body', async () => {
    const res = await getUsers();

    expect(res.body).toEqual({
      content: [],
      page: 0,
      size: 10,
      totalPages: 0,
    });
  });

  it('returns 10 users in page content when there are 11 users in db', async () => {
    await addUsers(11);

    const res = await getUsers();

    expect(res.body.content.length).toBe(10);
  });

  it('returns 6 users in page content when there are 6 active users and 5 inactive users', async () => {
    await addUsers(6, 5);

    const res = await getUsers();

    expect(res.body.content.length).toBe(6);
  });

  it('returns only id, username & email when users are queried', async () => {
    await addUsers(11);

    const res = await getUsers();
    const user = res.body.content[0];
    expect(Object.keys(user)).toEqual(['id', 'username', 'email']);
  });

    it('returns 2 as totalPages where there are 15 active users and 7 inactive users', async () => {
      await addUsers(15, 7);
      const res = await getUsers();
      expect(res.body.totalPages).toBe(2);
    });

    it('returns 2nd page of users and page indicator when 1st page is displayed in the req', async () => {
      await addUsers(11);
      const res = await getUsers().query({ page: 1 });

      expect(res.body.content[0].username).toBe('user11');

      expect(res.body.page).toBe(1);
    });

    it('returns 1st page when page is set below 0 in the params', async () => {
      await addUsers(11);
      const res = await getUsers().query({ page: -5 });

      expect(res.body.page).toBe(0);
    });
});
