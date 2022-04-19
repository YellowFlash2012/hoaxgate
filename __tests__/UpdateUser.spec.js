import { describe, expect, test, jest } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';
import User from '../src/models/Users.js';

import sequelize from '../src/config/db.js';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import config from 'config';

const { uploadDir, profileDir } = config;
const profileDirectory = path.join('.', uploadDir, profileDir);

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

const putUser = async (id = 7, body = null, options = {}) => {
    let agent = request(app);

    let token;

    if (options.auth) {
        const res = await agent.post('/api/1.0/auth').send(options.auth);

        token = res.body.token;
    }

    agent = request(app).put('/api/1.0/users/' + id);

    if (token) {
        agent.set('Authorization', `Bearer ${token}`);
    }

    if (options.token) {
        agent.set('Authorization', `Bearer ${options.token}`);
    }

    return agent.send(body);
};

const readFileAsBase64 = () => {
    const filePath = path.join('.', '__tests__', 'assets', 'test-png.png');

    return fs.readFileSync(filePath, { encoding: 'base64' });
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

    it('returns 200 ok when valid update req is sent by authorized user', async () => {
        const savedUser = await addUser();
        const validUpdate = { username: 'user1-echo' };
        const res = await putUser(savedUser.id, validUpdate, {
            auth: { email: savedUser.email, password: 'pjfqig7h9Kpmfd' },
        });

        expect(res.status).toBe(200);
    });

    it('updates username in db when valid update req is sent by authorized user', async () => {
        const savedUser = await addUser();
        const validUpdate = { username: 'user1-echo' };

        await putUser(savedUser.id, validUpdate, {
            auth: { email: savedUser.email, password: 'pjfqig7h9Kpmfd' },
        });

        const inDBUser = await User.findOne({ where: { id: savedUser.id } });

        expect(inDBUser.username).toBe(validUpdate.username);
    });

    it('returns 403 when token is not valid', async () => {
        const res = await putUser(7, null, { token: '123' });

        expect(res.status).toBe(403);
    });

    it('saves the user img when update contains img as base64', async () => {
        const fileInBase64 = readFileAsBase64();

        const savedUser = await addUser();
        const validUpdate = { username: 'user1-echo', image: fileInBase64 };

        await putUser(savedUser.id, validUpdate, {
            auth: { email: savedUser.email, password: 'pjfqig7h9Kpmfd' },
        });

        const inDBUser = await User.findOne({ where: { id: savedUser.id } });

        expect(inDBUser.image).toBeTruthy();
    });

    it('returns success body with only id, username, email,image', async () => {
        const fileInBase64 = readFileAsBase64();

        const savedUser = await addUser();
        const validUpdate = { username: 'user1-echo', image: fileInBase64 };

        const res = await putUser(savedUser.id, validUpdate, {
            auth: { email: savedUser.email, password: 'pjfqig7h9Kpmfd' },
        });

        expect(Object.keys(res.body)).toEqual([
            'id',
            'username',
            'email',
            'image',
        ]);
    });

    it('saves the user img in upload folder and stores filename in User when update has img', async () => {
        const fileInBase64 = readFileAsBase64();

        const savedUser = await addUser();
        const validUpdate = { username: 'user1-echo', image: fileInBase64 };

        await putUser(savedUser.id, validUpdate, {
            auth: { email: savedUser.email, password: 'pjfqig7h9Kpmfd' },
        });

        const inDBUser = await User.findOne({ where: { id: savedUser.id } });

        const profileImagePath = path.join(profileDirectory, inDBUser.image);

        expect(fs.existsSync(profileImagePath)).toBe(true);
    });
});
