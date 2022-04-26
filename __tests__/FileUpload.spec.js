import request from 'supertest';
import app from '../server.js';
import path from 'path';
import fs from 'fs';
import sequelize from '../src/config/db.js';
import FileAttachment from '../src/models/FileAttachment.js';
import config from 'config';

const { profileDir, attachmentDir } = config;

beforeAll(async () => {
    if (process.env.NODE_ENV === 'test') {
        await sequelize.sync();
    }
});

beforeEach(async () => {
    await FileAttachment.destroy({ truncate: true });
});

const uploadFile = () => {
    return request(app)
        .post('/api/1.0/hoaxes/attachments')
        .attach(
            'file',
            path.join('.', '__tests__', 'resources', 'test-png.png')
        );
};

describe('Upload files for hoaxes', () => {
    it('returns 200 ok after successful upload', async () => {
        const res = await uploadFile();

        expect(res.status).toBe(200);
    });

    it('saves dynamicFile,uploadDate as attachment object in db', async () => {
        const beforeSubmit = Date.now();

        await uploadFile();

        const attachments = await FileAttachment.findAll();
        const attachment = attachments[0];

        expect(attachment.filename).not.toBe('test-png.png');
        expect(attachment.uploadDate.getTime()).toBeGreaterThan(beforeSubmit);
    });

    it('saves file to attachment folder', async () => {
        await uploadFile();

        const attachments = await FileAttachment.findAll();
        const attachment = attachments[0];

        const filePath = path.join('.', uploadDir, attachmentDir, attachments);

        expect(fs.existsSync(filePath)).toBe(true);
    });
});
