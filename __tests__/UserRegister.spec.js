import { describe, expect, test, jest } from '@jest/globals';
import request from 'supertest';

import app from '../server.js';

import User from '../src/models/Users.js';

import sequelize from '../src/config/db.js';
// import nodemailerStub from 'nodemailer-stub';
import SMTPServer from "smtp-server"

import EmailService from '../src/routes/EmailService.js';

let lastMail, server;
let simulateSmtpFailure = false;

// run this algo before any test
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
                const err = new Error("Invalid mailbox");
                err.responseCode = 553;
                return callback(err);
            } 
            lastMail = mailBody;
            callback();
        });
        },
    });

    await server.listen(8587, "localhost");
    await sequelize.sync();
});

// to run each test in isolated env
beforeEach(() => {
    simulateSmtpFailure = false;
    return User.destroy({ truncate: true });
});

afterAll(async () => {
    await server.close();
});

const validUser = {
    username: 'user1',
    email: 'user1@email.com',
    password: 'pjfqig7è9Kpmfd',
};

const postUser = (user = validUser) => {
    return request(app).post('/api/1.0/users').send(user);
};

describe('User registration', () => {
  it('returns 200 OK when signup request is valid', async () => {
    const res = await postUser();

    expect(res.status).toBe(200);
  });

  it('returns success message when signup request is valid', async () => {
    const res = await postUser();

    expect(res.body.message).toBe('User created');
  });

  it('saves the user to the db', async () => {
    await postUser();

    const userList = await User.findAll();

    expect(userList.length).toBe(1);
  });

  it('saves the username and email to the db', async () => {
    await postUser();

    const userList = await User.findAll();

    const savedUser = userList[0];

    expect(savedUser.username).toBe('user1');

    expect(savedUser.email).toBe('user1@email.com');
  });

  it('hashes the password in the db', async () => {
    await postUser();

    const userList = await User.findAll();

    const savedUser = userList[0];

    expect(savedUser.password).not.toBe('pjfqig7è9Kpmfd');
  });

  it('returns 400 when username is null', async () => {
    const res = await postUser({
      username: null,
      email: 'user1@email.com',
      password: 'pjfqig7è9Kpmfd',
    });

    expect(res.status).toBe(400);
  });

  it('returns validationErrors field in res body when validation error occurs', async () => {
    const res = await postUser({
      username: null,
      email: 'user1@email.com',
      password: 'pjfqig7è9Kpmfd',
    });

    const body = res.body;

    expect(body.validationErrors).not.toBeUndefined();
  });

  it('returns errors for both when username and email are null', async () => {
    const res = await postUser({
      username: null,
      email: null,
      password: 'pjfqig7è9Kpmfd',
    });

    const body = res.body;

    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });

  it.each`
    field         | value               | expectedMessage
    ${'username'} | ${null}             | ${'Username can NOT be null'}
    ${'username'} | ${'usr'}            | ${'Username must have min 4 and max of 32 characters'}
    ${'username'} | ${'a'.repeat(33)}   | ${'Username must have min 4 and max of 32 characters'}
    ${'email'}    | ${null}             | ${'Email can NOT be null'}
    ${'email'}    | ${'mail.io'}        | ${'Email is NOT valid'}
    ${'email'}    | ${'user.mail.io'}   | ${'Email is NOT valid'}
    ${'email'}    | ${'user@mail'}      | ${'Email is NOT valid'}
    ${'password'} | ${null}             | ${'Password can NOT be null'}
    ${'password'} | ${'pjfq'}           | ${'Password must be at least 13 characters long'}
    ${'password'} | ${'alllowercases'}  | ${'Password must have at least 1 uppercase, 1 lowercase and 1 number'}
    ${'password'} | ${'ALLUPPERCASES'}  | ${'Password must have at least 1 uppercase, 1 lowercase and 1 number'}
    ${'password'} | ${'12875466370543'} | ${'Password must have at least 1 uppercase, 1 lowercase and 1 number'}
    ${'password'} | ${'lowerandUPPER'}  | ${'Password must have at least 1 uppercase, 1 lowercase and 1 number'}
    ${'password'} | ${'lowerand96326'}  | ${'Password must have at least 1 uppercase, 1 lowercase and 1 number'}
    ${'password'} | ${'UPPER444963726'} | ${'Password must have at least 1 uppercase, 1 lowercase and 1 number'}
  `(
    'returns $expectedMessage when $field is $value',
    async ({ field, value, expectedMessage }) => {
      const user = {
        username: 'user1',
        email: 'user1@email.com',
        password: 'pjfqig7è9Kpmfd',
      };

      user[field] = value;
      const res = await postUser(user);

      const body = res.body;
      expect(body.validationErrors[field]).toBe(expectedMessage);
    }
  );

  it('returns email already used when a known email is being used for new registration', async () => {
    await User.create({ ...validUser });
    const res = await postUser();

    expect(res.body.validationErrors.email).toBe('Email already used');
  });

  it('returns errors for both username is null and email already in use', async () => {
    await User.create({ ...validUser });
    const res = await postUser({
      username: null,
      email: validUser.email,
      password: 'pjfqig7è9Kpmfd',
    });

    const body = res.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });

  it('creates user with inactive status', async () => {
    await postUser();
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });

  it('creates user with inactive status even when the req.body contains inactive=true', async () => {
    const newUser = { ...validUser, inactive: false };
    await postUser(newUser);
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });

  it('creates an activation token for user', async () => {
    await postUser();
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.activationToken).toBeTruthy();
  });

    it('sends an account activation email with activationToken', async () => {
      
        await postUser();
    
        const users = await User.findAll();
        const savedUser = users[0];
        expect(lastMail).toContain('user1@email.com');
        expect(lastMail).toContain(savedUser.activationToken);
    });

    it('returns 502 Bad Gateway when sending email fails', async () => {
        simulateSmtpFailure = true;
        const res = await postUser();
        expect(res.status).toBe(502);

    });
  
    it('returns email failure msg', async () => {
        simulateSmtpFailure = true;
        const res = await postUser();

        expect(res.body.msg).toBe("Email failure");
    });
    
    it("doesn't save user to db if activation email fails", async () => {
        simulateSmtpFailure = true;
        await postUser();

        const users = await User.findAll();
        expect(users.length).toBe(0);

    });
});

describe("Account activation", () => {
    it("activates the account when token is sent", async () => {
        await postUser();

        let users = await User.findAll();
        const token = users[0].activationToken;

        await request(app).post("/api/1.0/users/token" + token).send();
        users = await User.findAll();
        expect(users[0].inactive).toBe(false);
    })
    
    it("removes the token from the account after successful activation", async () => {
        await postUser();

        let users = await User.findAll();
        const token = users[0].activationToken;

        await request(app).post("/api/1.0/users/token" + token).send();
        users = await User.findAll();
        expect(users[0].activationToken).toBeFalsy();
    });
    
    it("does NOT activate the account when the token is wrong", async () => {
        await postUser();

        const token = "token does NOT exist";

        await request(app).post("/api/1.0/users/token" + token).send();
        const users = await User.findAll();
        expect(users[0].inactive).toBe(true);
    });

    it("returns bad req when token is wrong", async () => {
        await postUser();
        const token = 'token does NOT exist';

        const res = await request(app)
            .post('/api/1.0/users/token' + token)
            .send();
        
        expect(res.status).toBe(400);
    });
})
