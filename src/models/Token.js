import { Sequelize } from 'sequelize';

import sequelize from '../config/db.js';

const Model = Sequelize.Model;

class Token extends Model {}

Token.init(
    {
        token: {
            type: Sequelize.STRING,
        },
        lastUsedAt: {
            type: Sequelize.DATE,
        },
    },
    {
        sequelize,
        modelName: 'token',
        timestamps: false,
    }
);

export default Token;
