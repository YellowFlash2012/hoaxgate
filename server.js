import express from 'express'
import userRoutes from './src/routes/Users.js'
import { config } from 'dotenv';
import morgan from 'morgan';

config();

const app = express();

app.use(express.json());

// to get an overvie of http verbs involved in a FE req
if (process.env.NODE_ENV === "development") {
    app.use(morgan('dev'))
}

app.use('/api/1.0/users', userRoutes);

console.log('env ' + process.env.NODE_ENV);

export default app