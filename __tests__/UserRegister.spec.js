import request from "supertest";

import app from '../server.js'

import User from '../src/models/Users.js'

import sequelize from '../src/config/db.js'

// run this algo before any test
beforeAll(() => {
    return sequelize.sync();
});

// to run each test in isolated env
beforeEach(() => {
    return User.destroy({ truncate: true });
})

const validUser = {
    username: 'user1',
    email: 'user1@email.com',
    password: 'pjfqig7è9K',
};

const postUser = (user = validUser) => {
    return request(app).post('/api/1.0/users').send(user);
};

describe("User registration", () => {

    it('returns 200 OK when signup request is valid', async () => {
        const res = await postUser();
        
        expect(res.status).toBe(200);
        
    });

    it('returns success message when signup request is valid', async () => {
        const res = await postUser();

        expect(res.body.message).toBe('User created');

        });

    
    it('saves the user to the db', async () => {
        await postUser()
    
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

        expect(savedUser.password).not.toBe('pjfqig7è9K');
    
    });

    it('returns 400 when username is null', async () => {
        const res = await postUser({
            username: null,
            email: 'user1@email.com',
            password: 'pjfqig7è9K',
        });

        expect(res.status).toBe(400)
    });

    it("returns validationErrors field in res body when validation error occurs", async () => {
        const res = await postUser({
            username: null,
            email: 'user1@email.com',
            password: 'pjfqig7è9K',
        });

        const body = res.body;

        expect(body.validationErrors).not.toBeUndefined()
    });
    
    it("returns username cannot be null when username is null", async () => {
        const res = await postUser({
            username: null,
            email: 'user1@email.com',
            password: 'pjfqig7è9K',
        });

        const body = res.body;

        expect(body.validationErrors.username).toBe("Username can NOT be null")
    });

    it('returns email cannot be null when email is null', async () => {
        const res = await postUser({
            username: "user1",
            email: null,
            password: 'pjfqig7è9K',
        });

        const body = res.body;

        expect(body.validationErrors.email).toBe('Email can NOT be null');
    });

    it('returns errors for both when username and email are null', async () => {
        const res = await postUser({
            username: null,
            email: null,
            password: 'pjfqig7è9K',
        });

        const body = res.body;

        expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
    });
})
