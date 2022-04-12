import { describe, expect, test, jest } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';
import User from '../src/models/Users.js';

import sequelize from '../src/config/db.js';
import bcrypt from 'bcrypt';

beforeAll(async () => {
    await sequelize.sync({ alter: true });
});

beforeEach(async () => {
    await User.destroy({ truncate: true });
});

const putUser = (id = 7, body = null, options = {}) => {
    const agent = request(app).put('/api/1.0/users/' + id);

    if (options.auth) {
        const { email, password } = options.auth;
        agent.auth(email, password);
    }

    return agent.send(body);
};

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

describe('Update user', () => {
    it('returns forbidden when req is sent without authorization', async () => {
        const res = await putUser();

        expect(res.status).toBe(403);
    });

    it('returns forbidden when req sent with incorrect email in basic auth', async () => {
        await addUser();

        const res = await putUser(5, null, {
            auth: { email: 'user1999@mail.io', password: 'pjfqig7è9Kpmfd' },
        });

        expect(res.status).toBe(403);
    });

    it('returns forbidden when req sent with incorrect password in basic auth', async () => {
        await addUser();

        const res = await putUser(5, null, {
            auth: { email: 'user1@mail.io', password: '*_#$ig7è9Kpmfd' },
        });

        expect(res.status).toBe(403);
    });

    it('returns forbidden when update req is sent with valid credentials but 4 wrong user in basic auth', async () => {
        await addUser();

        const userToBeUpdated = await addUser({
            ...activeUser,
            username: 'user2',
            email: 'user2@mail.io',
        });

        const res = await putUser(userToBeUpdated.id, null, {
            auth: { email: 'user1@mail.io', password: '*_#$ig7è9Kpmfd' },
        });

        expect(res.status).toBe(403);
    });

    it('returns forbidden when update req is sent by inactive user but 4 his own profile', async () => {
        const inactiveUser = await addUser({ ...activeUser, inactive: true });

        const res = await putUser(inactiveUser.id, null, {
            auth: { email: 'user1@mail.io', password: '*_#$ig7è9Kpmfd' },
        });

        expect(res.status).toBe(403);
    });
});
