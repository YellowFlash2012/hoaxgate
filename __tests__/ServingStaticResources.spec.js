import { describe, expect, test, jest } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';

import path from 'path';
import fs from 'fs';
import config from 'config';

const { uploadDir, profileDir } = config;
const profileFolder = path.join('.', uploadDir, profileDir);

describe('Profile Images', () => {
    const copyFile = () => {
        const filePath = path.join('.', '__tests__', 'assets', 'test-png.png');

        const storedFileName = 'test-file';
        const targetPath = path.join(profileFolder, storedFileName);

        fs.copyFileSync(filePath, targetPath);

        return storedFileName;
    };

    it('returns 404 when file not found!', async () => {
        const res = await request(app).get('/images/776699');

        expect(res.status).toBe(404);
    });

    it('returns 200 ok when file exists', async () => {
        const storedFileName = copyFile();

        const res = await request(app).get('/images/' + storedFileName);

        expect(res.status).toBe(200);
    });

    it('returns cache for 1 year in res', async () => {
        const storedFileName = copyFile();

        const res = await request(app).get('/images/' + storedFileName);

        const oneYearInSeconds = 365 * 24 * 60 * 60;

        expect(res.header['cache-control']).toContain(
            `max-age=${oneYearInSeconds}`
        );
    });
});
