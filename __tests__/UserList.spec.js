import { describe, expect, test, jest } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../server.js';
import User from '../src/models/Users.js';

import sequelize from '../src/config/db.js';

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

beforeEach(async () => {
    await User.destroy({ truncate: { cascade: true } });
});

const auth = async (options = {}) => {
    let token;

    if (options.auth) {
        const res = await request(app).post('/api/1.0/auth').send(options.auth);

        token = res.body.token;
    }

    return token;
};

const getUsers = (options = {}) => {
    const agent = request(app).get('/api/1.0/users');
    if (options.token) {
        agent.set('Authorization', `Bearer ${options.token}`);
    }
    return agent;
};

const addUsers = async (activeUsersCount, inactiveUsersCount = 0) => {
    const hash = await bcrypt.hash('pjfqig7è9Kpmfd', 10);
    for (let i = 0; i < activeUsersCount + inactiveUsersCount; i++) {
        await User.create({
            username: `user${i + 1}`,
            email: `user${i + 1}@email.io`,
            inactive: i >= activeUsersCount,
            password: hash,
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

    it('returns only id, username, email & image when users are queried', async () => {
        await addUsers(11);

        const res = await getUsers();
        const user = res.body.content[0];
        expect(Object.keys(user)).toEqual(['id', 'username', 'email', 'image']);
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

    it('returns 5 users & corresponding # indicator when # of pages is set in the req.params', async () => {
        await addUsers(11);
        const res = await getUsers().query({ size: 5 });

        expect(res.body.content.length).toBe(5);
        expect(res.body.size).toBe(5);
    });

    it('returns 10 users & corresponding size indicators when size is set to 1000', async () => {
        await addUsers(11);

        const res = await getUsers().query({ size: 1000 });

        expect(res.body.content.length).toBe(10);
        expect(res.body.size).toBe(10);
    });

    it('returns 10 users & corresponding size indicators when size is set to 0', async () => {
        await addUsers(11);

        const res = await getUsers().query({ size: 0 });

        expect(res.body.content.length).toBe(10);
        expect(res.body.size).toBe(10);
    });

    it('returns page = 0 & size=10 when non numeric values are provided in req.params', async () => {
        await addUsers(11);

        const res = await getUsers().query({ size: 'size', page: 'page' });

        expect(res.body.page).toBe(0);
        expect(res.body.size).toBe(10);
    });

    it('returns user page without logged in user when req has valid auth', async () => {
        await addUsers(11);

        const token = await auth({
            auth: { email: 'user1@mail.io', password: 'pjfqig7è9Kpmfd' },
        });

        const res = await getUsers({
            token: token,
        });

        expect(res.body.totalPages).toBe(1);
    });
});

describe('Single user', () => {
    const getUser = (id = 7) => {
        return request(app).get('/api/1.0/users/' + id);
    };
    it('returns 404 when user is NOT found', async () => {
        const res = await getUser();

        expect(res.status).toBe(404);
    });

    it('returns proper error body when user not found', async () => {
        const nowInMillis = new Date().getTime();
        const res = await getUser();

        const error = res.body;
        expect(error.path).toBe('/api/1.0/users/7');
        expect(error.timestamp).toBeGreaterThan(nowInMillis);
        expect(Object.keys(error)).toEqual(['path', 'timestamp', 'message']);
    });

    it('returns 200 when an active user exists', async () => {
        const user = await User.create({
            username: 'user1',
            email: 'user1@mail.io',
            inactive: false,
        });

        const res = await getUser(user.id);
        expect(res.status).toBe(200);
    });

    it('returns id, username,email & image in res.body when an active user is found', async () => {
        const user = await User.create({
            username: 'user1',
            email: 'user1@mail.io',
            inactive: false,
        });

        const res = await getUser(user.id);
        expect(Object.keys(res.body)).toEqual([
            'id',
            'username',
            'email',
            'image',
        ]);
    });

    it('returns 404 when the user is inactive', async () => {
        const user = await User.create({
            username: 'user1',
            email: 'user1@mail.io',
            inactive: true,
        });

        const res = await getUser(user.id);
        expect(res.status).toBe(404);
    });
});
