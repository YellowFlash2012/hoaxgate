'use strict';

import bcrypt from 'bcrypt';

export async function up(queryInterface, Sequelize) {
    const hash = await bcrypt.hash('pjfqig7h9Kpmfd', 10);
    const users = [];

    for (let i = 0; i < activeUsersCount + inactiveUsersCount; i++) {
        users.push({
            username: `user${i + 1}`,
            email: `user${i + 1}@email.io`,
            password: hash,
            inactive: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    await queryInterface.bulkInsert('users', users, {});
}
export async function down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
}
