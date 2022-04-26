import { describe, expect, test, jest } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../server.js';
import User from '../src/models/Users.js';

import sequelize from '../src/config/db.js';
import Hoax from '../src/models/Hoax.js';

beforeAll(async () => {
    if (process.env.NODE_ENV === 'test') {
        await sequelize.sync();
    }
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

describe('Hoaxes list', () => {
    const addHoaxes = async (count) => {
        for (let i = 0; i < count; i++) {
            const user = await User.create({
                username: `user${i + 1}`,
                email: `user${i + 1}@email.io`,
            });

            await Hoax.create({
                content: `hoax content ${i + 1}`,
                timestamp: Date.now(),
                userId: user.id,
            });
        }
    };

    const getHoaxes = () => {
        const agent = request(app).get('/api/1.0/hoaxes');

        return agent;
    };

    it('returns 200 ok when there are no hoax in the db', async () => {
        const res = await getHoaxes();

        expect(res.status).toBe(200);
    });

    it('returns page object as res body', async () => {
        const res = await getHoaxes();

        expect(res.body).toEqual({
            content: [],
            page: 0,
            size: 10,
            totalPages: 0,
        });
    });

    it('returns 10 users in page content when there are 11 users in db', async () => {
        await addHoaxes(11);

        const res = await getHoaxes();

        expect(res.body.content.length).toBe(10);
    });

    it('returns only id, content,tinestamp and user object having id, username, email & image when hoaxes are queried', async () => {
        await addHoaxes(11);

        const res = await getHoaxes();
        const hoax = res.body.content[0];

        const hoaxKeys = Object.keys(hoax);
        const userKeys = Object.keys(hoax.user);

        expect(hoaxKeys).toEqual(['id', 'content', 'timestamp']);
        expect(userKeys).toEqual(['id', 'username', 'email', 'image']);
    });

    it('returns 2 as totalPages when there are 11 hoaxes', async () => {
        await addHoaxes(11);
        const res = await getHoaxes();
        expect(res.body.totalPages).toBe(2);
    });

    it('returns 2nd page of hoaxes and page indicator when 1st page is displayed in the req', async () => {
        await addHoaxes(11);
        const res = await getHoaxes().query({ page: 1 });

        expect(res.body.content[0].content).toBe('hoax content 1');

        expect(res.body.page).toBe(1);
    });

    it('returns 1st page when page is set below 0 in the params', async () => {
        await addHoaxes(11);
        const res = await getHoaxes().query({ page: -5 });

        expect(res.body.page).toBe(0);
    });

    it('returns 5 hoaxes & corresponding # indicator when # of pages is set in the req.params', async () => {
        await addHoaxes(11);
        const res = await getHoaxes().query({ size: 5 });

        expect(res.body.content.length).toBe(5);
        expect(res.body.size).toBe(5);
    });

    it('returns 10 hoaxes & corresponding size indicators when size is set to 1000', async () => {
        await addHoaxes(11);

        const res = await getHoaxes().query({ size: 1000 });

        expect(res.body.content.length).toBe(10);
        expect(res.body.size).toBe(10);
    });

    it('returns 10 hoaxes & corresponding size indicators when size is set to 0', async () => {
        await addHoaxes(11);

        const res = await getHoaxes().query({ size: 0 });

        expect(res.body.content.length).toBe(10);
        expect(res.body.size).toBe(10);
    });

    it('returns page = 0 & size=10 when non numeric values are provided in req.params', async () => {
        await addHoaxes(11);

        const res = await getHoaxes().query({ size: 'size', page: 'page' });

        expect(res.body.page).toBe(0);
        expect(res.body.size).toBe(10);
    });

    it('returns newer hoaxes before older ones', async () => {
        await addHoaxes(11);
        const res = await getHoaxes();
        const firstHoax = res.body.content[0];
        const lastHoax = res.body.content[9];

        expect(firstHoax.timestamp).toBeGreaterThan(lastHoax.timestamp);
    });
});

describe('List of a user hoaxes', () => {
    const addUser = async (name = 'user1') => {
        return await User.create({
            username: name,
            email: `${name}@mail.io`,
        });
    };

    const addHoaxes = async (count, userId) => {
        for (let i = 0; i < count; i++) {
            await Hoax.create({
                content: `hoax content ${i + 1}`,
                timestamp: Date.now(),
                userId: userId,
            });
        }
    };

    const getHoaxes = (id) => {
        const agent = request(app).get(`/api/1.0/users/${id}/hoaxes`);

        return agent;
    };

    it('returns 200 ok when there are no hoax in the db', async () => {
        const user = await addUser();
        const res = await getHoaxes(user.id);

        expect(res.status).toBe(200);
    });

    it('returns 404 when user doesn NOT exist', async () => {
        const res = await getHoaxes(9);

        expect(res.status).toBe(404);
    });

    it('returns page object as res body', async () => {
        const user = await addUser();
        const res = await getHoaxes(user.id);

        expect(res.body).toEqual({
            content: [],
            page: 0,
            size: 10,
            totalPages: 0,
        });
    });

    it('returns 10 users in page content when there are 11 users in db', async () => {
        const user = await addUser();

        await addHoaxes(11, user.id);

        const res = await getHoaxes(user.id);

        expect(res.body.content.length).toBe(10);
    });

    it('returns 5 hoaxes belonging to suer when there are 11 hoaxes on the page', async () => {
        const user = await addUser();

        await addHoaxes(5, user.id);
        const user2 = await addUser('user2');
        await addHoaxes(6, user2.id);

        const res = await getHoaxes(user.id);
        expect(res.body.content.length).toBe(5);
    });

    it('returns only id, content,tinestamp and user object having id, username, email & image when hoaxes are queried', async () => {
        const user = await addUser();

        await addHoaxes(5, user.id);
        const user2 = await addUser('user2');
        const hoax = res.body.content[0];

        const hoaxKeys = Object.keys(hoax);
        const userKeys = Object.keys(hoax.user);

        expect(hoaxKeys).toEqual(['id', 'content', 'timestamp']);
        expect(userKeys).toEqual(['id', 'username', 'email', 'image']);
    });

    it('returns 2 as totalPages when there are 11 hoaxes', async () => {
        const user = await addUser();

        await addHoaxes(11, user.id);
        const res = await getHoaxes(user.id).query({ page: 1 });
        expect(res.body.totalPages).toBe(2);
    });

    it('returns 2nd page of hoaxes and page indicator when 1st page is displayed in the req', async () => {
        const user = await addUser();
        await addHoaxes(11, user.id);
        const res = await getHoaxes(user.id).query({ page: 1 });

        expect(res.body.content[0].content).toBe('hoax content 1');

        expect(res.body.page).toBe(1);
    });

    it('returns 1st page when page is set below 0 in the params', async () => {
        const user = await addUser();
        await addHoaxes(11, user.id);
        const res = await getHoaxes(user.id).query({ page: -5 });

        expect(res.body.page).toBe(0);
    });

    it('returns 5 hoaxes & corresponding # indicator when # of pages is set in the req.params', async () => {
        const user = await addUser();
        await addHoaxes(11, user.id);
        const res = await getHoaxes(user.id).query({ size: 5 });

        expect(res.body.content.length).toBe(5);
        expect(res.body.size).toBe(5);
    });

    it('returns 10 hoaxes & corresponding size indicators when size is set to 1000', async () => {
        const user = await addUser();
        await addHoaxes(11, user.id);

        const res = await getHoaxes(user.id).query({ size: 1000 });

        expect(res.body.content.length).toBe(10);
        expect(res.body.size).toBe(10);
    });

    it('returns 10 hoaxes & corresponding size indicators when size is set to 0', async () => {
        const user = await addUser();
        await addHoaxes(11, user.id);

        const res = await getHoaxes(user.id).query({ size: 0 });

        expect(res.body.content.length).toBe(10);
        expect(res.body.size).toBe(10);
    });

    it('returns page = 0 & size=10 when non numeric values are provided in req.params', async () => {
        const user = await addUser();
        await addHoaxes(11, user.id);

        const res = await getHoaxes(user.id).query({
            size: 'size',
            page: 'page',
        });

        expect(res.body.page).toBe(0);
        expect(res.body.size).toBe(10);
    });

    it('returns newer hoaxes before older ones', async () => {
        const user = await addUser();
        await addHoaxes(11, user.id);
        const res = await getHoaxes(user.id);
        const firstHoax = res.body.content[0];
        const lastHoax = res.body.content[9];

        expect(firstHoax.timestamp).toBeGreaterThan(lastHoax.timestamp);
    });
});
