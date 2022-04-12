import express from 'express'
import userRoutes from './src/routes/Users.js'
import authRoutes from './src/routes/Auth.js';
import { config } from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import errorHandler from './src/error/errorHandler.js';

// internationalization
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';

config();

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

// Importing the fs and https modules
import https from 'https';
import fs from 'fs';

// Read the certificate and the private key for the https server options
const options = {
  key: fs.readFileSync('./config/cert.key'),
  cert: fs.readFileSync('./config/cert.crt'),
};

const app = express();

app.use(middleware.handle(i18next));

app.use(express.json());
app.use(cors());

// to get an overvie of http verbs involved in a FE req
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api/1.0/users', userRoutes);
app.use('/api/1.0/auth', authRoutes);

app.use(errorHandler)

console.log('env: ' + process.env.NODE_ENV);

// Create the https server by initializing it with 'options'
// -------------------- STEP 3
// https.createServer(options, app).listen(5000, () => {
//     console.log(`HTTPS server started on port 5000`);
// });

export default app