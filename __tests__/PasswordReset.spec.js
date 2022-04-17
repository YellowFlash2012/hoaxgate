import request from 'supertest';
import app from '../server.js';

import User from '../src/models/Users.js';

import sequelize from '../src/config/db.js';
import bcrypt from 'bcrypt';

beforeAll(async () => {
    await sequelize.sync({ force: true });
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

const postPasswordReset = (email = 'user1@mail.io') => {
    const agent = request(app).post('/api/1.0/users/password-reset');

    return agent.send({ email: email });
};

describe('Password Reset Req', () => {
    it('returns 404 when a password reset req is sent from unknown email', async () => {
        const res = await postPasswordReset();

        expect(res.status).toBe(404);
    });

    it('returns 200 ok when password reset req is sent from known email', async () => {
        const user = await addUser();

        const res = await postPasswordReset(user.email);

        expect(res.status).toBe(200);
    });

    it('creates password reset token when password req is sent from a known email', async () => {
        const user = await addUser();
        await postPasswordReset(user.email);

        const userInDB = await User.findOne({ where: { email: user.email } });

        expect(userInDB.passwordResetToken).toBeTruthy();
    });
});
