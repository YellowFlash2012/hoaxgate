import { describe, expect, test, jest } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';
import User from '../src/models/Users.js';

import sequelize from '../src/config/db.js';
import bcrypt from 'bcrypt';
import Token from '../src/models/Token.js';

beforeAll(async () => {
    await sequelize.sync({ alter: true });
});

beforeEach(async () => {
    await User.destroy({ truncate: { cascade: true } });
});

const activeUser = {
    username: 'user1',
    email: 'user1@mail.io',
    password: 'pjfqig7h9Kpmfd',
    inactive: false,
};

const addUser = async (user = { ...activeUser }) => {
    const hash = await bcrypt.hash(user.password, 10);
    user.password = hash;
    return await User.create(user);
};

const postAuth = async (credentials) => {
    return await request(app).post('/api/1.0/auth').send(credentials);
};

const postLogout = (options = {}) => {
    const agent = request(app).post('/api/1.0/auth/logout');

    if (options.token) {
        agent.set('Authorization', `Bearer ${options.token}`);
    }

    return agent.send();
};

describe('Authentication', () => {
    it('returns 200 when credentials are correct', async () => {
        await addUser({ ...activeUser, inactive: false });

        const res = await postAuth({
            email: 'user1@mail.io',
            password: 'pjfqig7h9Kpmfd',
        });

        expect(res.status).toBe(200);
    });

    it('returns only user id, username & token when login is successful', async () => {
        const user = await addUser({ ...activeUser, inactive: false });
        const res = await postAuth({
            email: 'user1@mail.io',
            password: 'pjfqig7h9Kpmfd',
        });

        expect(res.body.id).toBe(user.id);
        expect(res.body.username).toBe(user.username);
        expect(Object.keys(res.body)).toEqual(['id', 'username', 'token']);
    });

    it('returns 401 when user does NOT exist', async () => {
        const res = await postAuth({
            email: 'user1@mail.io',
            password: 'pjfqig7h9Kpmfd',
        });

        expect(res.status).toBe(401);
    });

    it('returns proper error body when auth fails', async () => {
        const nowInMills = new Date().getTime();
        const res = await postAuth({
            email: 'user1@mail.io',
            password: 'pjfqig7h9Kpmfd',
        });

        const error = res.body;

        expect(error.path).toBe('/api/1.0/auth');
        expect(error.timestamp).toBeGreaterThan(nowInMills);
        expect(Object.keys(error)).toEqual(['path', 'timestamp', 'message']);
    });

    it('returns 401 when password is wrong', async () => {
        await addUser();

        const res = await postAuth({
            email: 'user1@mail.io',
            password: '---*ig7h9Kpmfd',
        });

        expect(res.status).toBe(401);
    });

    it('returns 403 when logging in with inactive account', async () => {
        await addUser({ ...activeUser, inactive: true });

        const res = await postAuth({
            email: 'user1@mail.io',
            password: 'pjfqig7h9Kpmfd',
        });

        expect(res.status).toBe(403);
    });

    it('returns proper error body when inactive auth fails', async () => {
        await addUser({ ...activeUser, inactive: true });

        const nowInMills = new Date().getTime();
        const res = await postAuth({
            email: 'user1@mail.io',
            password: 'pjfqig7h9Kpmfd',
        });

        const error = res.body;

        expect(error.path).toBe('/api/1.0/auth');
        expect(error.timestamp).toBeGreaterThan(nowInMills);
        expect(Object.keys(error)).toEqual(['path', 'timestamp', 'message']);
    });

    it('returns 401 when email is NOT valid', async () => {
        const res = await postAuth({ password: 'pjfqig7h9Kpmfd' });

        expect(res.status).toBe(401);
    });

    it('returns 401 when password is NOT valid', async () => {
        const res = await postAuth({ email: 'user1@mail.io' });

        expect(res.status).toBe(401);
    });

    it('returns token in res body when credentials are valid', async () => {
        await addUser();

        const res = await postAuth({
            email: 'user1@mail.io',
            password: 'pjfqig7h9Kpmfd',
        });

        expect(res.body.token).not.toBeUndefined();
    });
});

describe('Logout', () => {
    it('returns 200 ok when unauthorized req sent for logout', async () => {
        const res = await postLogout();

        expect(res.status).toBe(200);
    });

    it('removes the token from DB', async () => {
        await addUser();

        const res = await postAuth({
            email: 'user1@mail.io',
            password: 'pjfqig7h9Kpmfd',
        });

        const token = res.body.token;

        await postLogout({ token: token });

        const storedToken = await Token.findOne({ where: { token: token } });

        expect(storedToken).toBeNull();
    });
});