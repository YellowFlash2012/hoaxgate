import { Sequelize } from "sequelize";
import config from 'config'

const dbConfig = config.get('database');

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    dialect: dbConfig.dialect,
    logging:false
});

// 'postgresql://postgres:postgres@localhost:5432/hoaxgate';

export default sequelize