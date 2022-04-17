import { describe, expect, test, jest } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';
import User from '../src/models/Users.js';

import sequelize from '../src/config/db.js';
import bcrypt from 'bcrypt';
import Token from '../src/models/Token.js';

// beforeAll(async () => {
//     await sequelize.sync();
// });

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

describe('Token Expiration', () => {
    const putUser = async (id = 7, body = null, options = {}) => {
        let agent = request(app);

        agent = request(app).put('/api/1.0/users/' + id);

        if (options.token) {
            agent.set('Authorization', `Bearer ${options.token}`);
        }

        return agent.send(body);
    };

    it('returns 403 when token is older than 7 days', async () => {
        const savedUser = await addUser();

        const token = 'test-token';
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 - 1);

        await Token.create({
            token: token,
            userId: savedUser.id,
            lastUsedAt: oneWeekAgo,
        });

        const validUpdate = { username: 'user1-updated' };

        const res = await putUser(savedUser.id, validUpdate, { token: token });

        expect(res.status).toBe(403);
    });

    it('refreshes lastUsedAt when unexpired token is used', async () => {
        const savedUser = await addUser();

        const token = 'test-token';
        const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);

        await Token.create({
            token: token,
            userId: savedUser.id,
            lastUsedAt: fourDaysAgo,
        });

        const validUpdate = { username: 'user1-updated' };

        const rightBe4SendReq = new Date();

        await putUser(savedUser.id, validUpdate, { token: token });

        const tokenInDB = await Token.findOne({ where: { token: token } });

        expect(tokenInDB.lastUsedAt.getTime()).toBeGreaterThan(
            rightBe4SendReq.getTime()
        );
    });

    it('refreshes lastUsedAt when unexpired token is used 4 an endpoint not needing auth', async () => {
        const savedUser = await addUser();

        const token = 'test-token';
        const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);

        await Token.create({
            token: token,
            userId: savedUser.id,
            lastUsedAt: fourDaysAgo,
        });

        const rightBe4SendReq = new Date();

        await request(app)
            .get('/api/1.0/users/7')
            .set('Authorization', `Bearer: ${token}`);

        const tokenInDB = await Token.findOne({ where: { token: token } });

        expect(tokenInDB.lastUsedAt.getTime()).toBeGreaterThan(
            rightBe4SendReq.getTime()
        );
    });
});