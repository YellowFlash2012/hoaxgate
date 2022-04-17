import { Sequelize } from "sequelize";

import sequelize from '../config/db.js'
import Token from './Token.js';

const Model = Sequelize.Model;

class User extends Model {}

User.init(
    {
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
    },
    {
        sequelize,
        modelName: 'user',
    }
);

User.hasMany(Token, { onDelete: 'cascade', foreignKey: 'userId' });

export default User