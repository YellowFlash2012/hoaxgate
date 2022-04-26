'use strict';

export async function up(queryInterface, Sequelize) {
    await queryInterface.addColumn('hoaxes', 'userId', {
        type: Sequelize.INTEGER,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'cascade',
    });
}
export async function down(queryInterface, Sequelize) {
    await queryInterface.deleteColumn('hoaxes', 'userId');
}
