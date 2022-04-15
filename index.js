import app from './server.js';
import sequelize from './src/config/db.js';
import User from './src/models/Users.js';
import bcrypt from 'bcrypt';

const addUsers = async (activeUsersCount, inactiveUsersCount = 0) => {
    const hash = await bcrypt.hash('pjfqig7h9Kpmfd', 10);

    for (let i = 0; i < activeUsersCount + inactiveUsersCount; i++) {
        await User.create({
            username: `user${i + 1}`,
            email: `user${i + 1}@email.io`,
            password: hash,
            inactive: i >= activeUsersCount,
        });
    }
};

sequelize.sync({ alter: true }).then(async () => {
    await addUsers(25);
});

app.listen(5000, () => {
    console.log('Server on | Port 5000');
});
