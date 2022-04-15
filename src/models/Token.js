import { Sequelize } from 'sequelize';

import sequelize from '../config/db.js';

const Model = Sequelize.Model;

class Token extends Model {}

Token.init(
    {
        token: {
            type: Sequelize.STRING,
        },

        userId: {
            type: Sequelize.INTEGER,
        },
    },
    {
        sequelize,
        modelName: 'token',
    }
);

export default Token;
