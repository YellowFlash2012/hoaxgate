import { describe, expect, test, jest } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';
import User from '../src/models/Users.js';

import sequelize from '../src/config/db.js';
import bcrypt from 'bcrypt';

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

beforeEach(async () => {
    await User.destroy({ truncate: true });
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

const auth = async (options = {}) => {
    let token;

    if (options.auth) {
        const res = await request(app).post('/api/1.0/auth').send(options.auth);

        token = res.body.token;
    }

    return token;
};

const deleteUser = async (id = 7, options = {}) => {
    let agent = request(app).delete('/api/1.0/users/' + id);

    if (options.token) {
        agent.set('Authorization', `Bearer ${options.token}`);
    }

    return agent.send();
};

describe('Delete user', () => {
    it('returns forbidden when req is sent without authorization', async () => {
        const res = await deleteUser();

        expect(res.status).toBe(403);
    });

    it('returns forbidden when delete req is sent with valid credentials but 4 wrong user in basic auth', async () => {
        await addUser();

        const userToBeDeleted = await addUser({
            ...activeUser,
            username: 'user2',
            email: 'user2@mail.io',
        });

        const token = await auth({
            auth: { email: 'user1@mail.io', password: 'pjfqig7h9Kpmfd' },
        });

        const res = await deleteUser(userToBeDeleted.id, {
            token: token,
        });

        expect(res.status).toBe(403);
    });

    it('returns 403 when token is not valid', async () => {
        const res = await deleteUser(7, { token: '123' });

        expect(res.status).toBe(403);
    });

    it('returns 200 ok when valid delete req is sent by authorized user', async () => {
        const savedUser = await addUser();

        const token = await auth({
            auth: { email: 'user1@mail.io', password: 'pjfqig7h9Kpmfd' },
        });

        const res = await deleteUser(savedUser.id, {
            token: token,
        });

        expect(res.status).toBe(200);
    });

    it('deletes user from db when req is sent from authorized user', async () => {
        const savedUser = await addUser();

        const token = await auth({
            auth: { email: 'user1@mail.io', password: 'pjfqig7h9Kpmfd' },
        });

        await deleteUser(savedUser.id, {
            token: token,
        });

        const inDBUser = await User.findOne({ where: { id: savedUser.id } });

        expect(inDBUser).toBeNull();
    });
});
