import { describe, expect, test, jest } from '@jest/globals';

import request from 'supertest';
import app from '../server.js';

import User from '../src/models/Users.js';

import sequelize from '../src/config/db.js';
import bcrypt from 'bcrypt';
import SMTPServer from 'smtp-server';
import config from 'config';

let lastMail, server;
let simulateSmtpFailure = false;

beforeAll(async () => {
    server = new SMTPServer.SMTPServer({
        authOptional: true,
        onData(stream, session, callback) {
            let mailBody;
            stream.on('data', (data) => {
                mailBody += data.toString();
            });
            stream.on('end', () => {
                if (simulateSmtpFailure) {
                    const err = new Error('Invalid mailbox');
                    err.responseCode = 553;
                    return callback(err);
                }
                lastMail = mailBody;
                callback();
            });
        },
    });

    await server.listen(8587, 'localhost');

    await sequelize.sync({ force: true });

    jest.setTimeout(20000);
});

beforeEach(async () => {
    simulateSmtpFailure = false;
    await User.destroy({ truncate: { cascade: true } });
});

afterAll(async () => {
    await server.close();
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

    it('sends a password reset email with passwordResetToken', async () => {
        const user = await addUser();
        await postPasswordReset(user.email);

        const userInDB = await User.findOne({ where: { email: user.email } });

        const passwordResetToken = userInDB.passwordResetToken;

        expect(lastMail).toContain('user1@mail.io');
        expect(lastMail).toContain(passwordResetToken);
    });
    it('returns 502 Bad Gateway when sending email fails', async () => {
        simulateSmtpFailure = true;
        const user = await addUser();
        const res = await postPasswordReset(user.email);
        expect(res.status).toBe(502);
    });
});
