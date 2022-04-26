import { Sequelize } from "sequelize";

import sequelize from '../config/db.js'
import Hoax from './Hoax.js';
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
        image: {
            type: Sequelize.STRING,
        },
    },
    {
        sequelize,
        modelName: 'user',
    }
);

User.hasMany(Token, { onDelete: 'cascade', foreignKey: 'userId' });
User.hasMany(Hoax, { onDelete: 'cascade', foreignKey: 'userId' });

Hoax.belongsTo(User);

export default User