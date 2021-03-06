'use strict';
export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
        },
        username: {
            type: Sequelize.STRING,
        },
        email: {
            type: Sequelize.STRING,
        },
        password: {
            type: Sequelize.STRING,
        },
        inactive: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
        },
        activationToken: {
            type: Sequelize.STRING,
        },
        passwordResetToken: {
            type: Sequelize.STRING,
        },
        image: {
            type: Sequelize.STRING,
        },
        createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
        },
        updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
        },
    });
}
export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
}
