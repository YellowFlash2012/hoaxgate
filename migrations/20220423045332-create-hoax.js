'use strict';

export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('hoaxes', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
        },

        content: {
            type: Sequelize.STRING,
        },
        timestamp: {
            type: Sequelize.BIGINT,
        },
    });
}
export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('hoaxes');
}
