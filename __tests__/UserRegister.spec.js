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
    password: 'pjfqig7è9Kpmfd',
};

const postUser = (user = validUser) => {
    return request(app).post('/api/1.0/users').send(user);
};

jest.setTimeout(30000);

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

        expect(savedUser.password).not.toBe('pjfqig7è9Kpmfd');
    
    });

    it('returns 400 when username is null', async () => {
        const res = await postUser({
          username: null,
          email: 'user1@email.com',
          password: 'pjfqig7è9Kpmfd',
        });

        expect(res.status).toBe(400)
    });

    it("returns validationErrors field in res body when validation error occurs", async () => {
        const res = await postUser({
          username: null,
          email: 'user1@email.com',
          password: 'pjfqig7è9Kpmfd',
        });

        const body = res.body;

        expect(body.validationErrors).not.toBeUndefined()
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

});
