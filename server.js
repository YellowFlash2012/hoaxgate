import express from 'express'
import userRoutes from './src/routes/Users.js'
import authRoutes from './src/routes/Auth.js';
import { config } from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import errorHandler from './src/error/errorHandler.js';
import tokenAuth from './src/middlewares/tokenAuth.js';

import path from 'path';
import fs from 'fs';
import configParams from 'config';

import { createFolders } from './src/file/FileService.js';

// internationalization
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';
config();

const { uploadDir, profileDir } = configParams;
const profileFolder = path.join('.', uploadDir, profileDir);

i18next
    .use(Backend)
    .use(middleware.LanguageDetector)
    .init({
        fallbackLng: 'en',
        lng: 'en',
        ns: ['translation'],
        defaultNS: 'translation',
        backend: {
            leadPah: './locales/{{lng}}/{{ns}}.json',
        },
        detection: {
            lookupHeader: 'accept-language',
        },
    });

createFolders();

const app = express();

app.use(middleware.handle(i18next));

app.use(express.json({ limit: '3mb' }));
app.use(cors());

// to get an overview of http verbs involved in a FE req
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// serving static resources
app.use(
    '/images',
    express.static(profileFolder, { maxAge: 365 * 24 * 60 * 60 * 1000 })
);

// middleware for refreshes lastUsedAt when unexpired token is used an endpoint not needing auth
app.use(tokenAuth);

app.use('/api/1.0/users', userRoutes);
app.use('/api/1.0/auth', authRoutes);

app.use(errorHandler);

console.log('env: ' + process.env.NODE_ENV);

export default app