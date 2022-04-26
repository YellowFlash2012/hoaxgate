import { describe, expect, test, jest } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';

import User from '../src/models/Users.js';

import sequelize from '../src/config/db.js';
import bcrypt from 'bcrypt';
import Hoax from '../src/models/Hoax.js';

jest.useFakeTimers();

beforeAll(async () => {
    if (process.env.NODE_ENV === 'test') {
        await sequelize.sync();
    }

    jest.setTimeout(20000);
});

beforeEach(async () => {
    jest.useFakeTimers();

    await User.destroy({ truncate: { cascade: true } });
});

afterAll(async () => {
    jest.setTimeout(5000);
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

const postHoax = async (body = null, options = {}) => {
    let agent = request(app);

    let token;

    if (options.auth) {
        const res = await agent.post('/api/1.0/auth').send(options.auth);

        token = res.body.token;
    }

    agent = request(app).post('/api/1.0/hoaxes');

    if (token) {
        agent.set('Authorization', `Bearer ${token}`);
    }

    if (options.token) {
        agent.set('Authorization', `Bearer ${options.token}`);
    }

    return agent.send(body);
};

const credentials = { email: 'user1@mail.io', password: 'pjfqig7h9Kpmfd' };

describe('Post Hoax', () => {
    it('returns 401 when hoax post req has no auth', async () => {
        const res = await postHoax();
        expect(res.status).toBe(401);
    });

    it('returns 200 when valid hoax submitted with authorized user', async () => {
        await addUser();
        const res = await postHoax(
            { content: 'Hoax content' },
            { auth: credentials }
        );
        expect(res.status).toBe(200);
    });

    it('saves the hoax to db when authorized user sends valid req', async () => {
        await addUser();
        await postHoax({ content: 'hoax content' }, { auth: credentials });

        const hoaxes = await Hoax.findAll();
        expect(hoaxes.length).toBe(1);
    });

    it('saves the hoax content & timestamps to db', async () => {
        await addUser();
        const beforeSubmit = Date.now();
        await postHoax({ content: 'hoax content' }, { auth: credentials });

        const hoaxes = await Hoax.findAll();
        const savedHoax = hoaxes[0];
        expect(savedHoax.content).toBe('Hoax content');
        expect(savedHoax.timestamp).toBeGreaterThan(beforeSubmit);
        expect(savedHoax.timestamp).toBeLessThan(Date.now());
    });

    it('returns 400 when hoax content is less than 10 characters', async () => {
        await addUser();
        const res = await postHoax({ content: 'hoax' }, { auth: credentials });
        expect(res.status).toBe(400);
    });

    it('returns validation error body when invalid hoax post is made by authed user', async () => {
        await addUser();
        const nowInMillis = Date.now();
        const res = await postHoax({ content: 'hoax' }, { auth: credentials });

        const error = res.body;
        expect(error.timestamp).toBeGreaterThan(nowInMillis);
        expect(error.path).toBe('/api/1.0/hoaxes');
        expect(Object.keys(error)).toEqual([
            'path',
            'timestamp',
            'message',
            'validationErrors',
        ]);
    });

    it('stores hoax creator id in db', async () => {
        const user = await addUser();
        await postHoax({ content: 'hoax' }, { auth: credentials });

        const hoaxes = await Hoax.findAll();
        const hoax = hoaxes[0];
        expect(hoax.userId).toBe(user.id);
    });
});
