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

describe("User registration", () => {

    const postValidUser = () => {
        return request(app).post('/api/1.0/users').send({
            username: 'user1',
            email: 'user1@email.com',
            password: 'pjfqig7è9K',
        });
    }

    it('returns 200 OK when signup request is valid', async () => {
        const res = await postValidUser();
        
        expect(res.status).toBe(200);
        
    });

    it('returns success message when signup request is valid', async () => {
        const res = await postValidUser();

        expect(res.body.message).toBe('User created');

        });

    
    it('saves the user to the db', async () => {
        await postValidUser()
    
        const userList = await User.findAll();
        
        expect(userList.length).toBe(1);
            
    });
    
    it('saves the username and email to the db', async () => {
        await postValidUser();

        const userList = await User.findAll();
        
        const savedUser = userList[0];

        expect(savedUser.username).toBe('user1');

        expect(savedUser.email).toBe('user1@email.com');

        
    });

    it('hashes the password in the db', async () => {
        await postValidUser();
        
        const userList = await User.findAll();

        const savedUser = userList[0];

        expect(savedUser.password).not.toBe('pjfqig7è9K');
    
    });
})
