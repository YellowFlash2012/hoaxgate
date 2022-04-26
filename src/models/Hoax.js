import { Sequelize } from 'sequelize';
import sequelize from '../config/db.js';

const Model = Sequelize.Model;

class Hoax extends Model {}

Hoax.init(
    {
        content: {
            type: Sequelize.STRING,
        },
        timestamp: {
            type: Sequelize.BIGINT,
        },
    },
    {
        sequelize,
        modelName: 'hoax',
        timestamps: false,
    }
);

export default Hoax;
