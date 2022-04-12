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

const activeUser = {
    username: 'user1',
    email: 'user1@mail.io',
    password: 'pjfqig7è9Kpmfd',
};

const addUser = async (user = { ...activeUser }) => {
    const hash = await bcrypt.hash(user.password, 10);
    user.password = hash;
    return await User.create(user);
};

const postAuth = async (credentials) => {
    return await request(app).post('/api/1.0/auth').send(credentials);
};

describe('Authentication', () => {
    it('returns 200 when credentials are correct', async () => {
        await addUser({ ...activeUser, inactive: false });

        const res = await postAuth({
            email: 'user1@mail.io',
            password: 'pjfqig7è9Kpmfd',
        });

        expect(res.status).toBe(200);
    });

    it('returns only user id and username when login is successful', async () => {
        const user = await addUser({ ...activeUser, inactive: false });
        const res = await postAuth({
            email: 'user1@mail.io',
            password: 'pjfqig7è9Kpmfd',
        });

        expect(res.body.id).toBe(user.id);
        expect(res.body.username).toBe(user.username);
        expect(Object.keys(res.body)).toEqual(['id', 'username']);
    });

    it('returns 401 when user does NOT exist', async () => {
        const res = await postAuth({
            email: 'user1@mail.io',
            password: 'pjfqig7è9Kpmfd',
        });

        expect(res.status).toBe(401);
    });

    it('returns proper error body when auth fails', async () => {
        const nowInMills = new Date().getTime();
        const res = await postAuth({
            email: 'user1@mail.io',
            password: 'pjfqig7è9Kpmfd',
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
            password: '---*ig7è9Kpmfd',
        });

        expect(res.status).toBe(401);
    });

    it('returns 403 when logging in with inactive account', async () => {
        await addUser({ ...activeUser, inactive: true });

        const res = await postAuth({
            email: 'user1@mail.io',
            password: 'pjfqig7è9Kpmfd',
        });

        expect(res.status).toBe(403);
    });

    it('returns proper error body when inactive auth fails', async () => {
        await addUser({ ...activeUser, inactive: true });

        const nowInMills = new Date().getTime();
        const res = await postAuth({
            email: 'user1@mail.io',
            password: 'pjfqig7è9Kpmfd',
        });

        const error = res.body;

        expect(error.path).toBe('/api/1.0/auth');
        expect(error.timestamp).toBeGreaterThan(nowInMills);
        expect(Object.keys(error)).toEqual(['path', 'timestamp', 'message']);
    });

    it('returns 401 when email is NOT valid', async () => {
        const res = await postAuth({ password: 'pjfqig7è9Kpmfd' });

        expect(res.status).toBe(401);
    });

    it('returns 401 when password is NOT valid', async () => {
        const res = await postAuth({ email: 'user1@mail.io' });

        expect(res.status).toBe(401);
    });
});
