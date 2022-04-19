import { createFolders } from '../src/file/FileService.js';
import fs from 'fs';
import path from 'path';

import config from 'config';

const { uploadDir, profileDir } = config;

describe('Create Folders', () => {
    it('creates upload folder', async () => {
        createFolders();
        // const folderName = 'upload';
        expect(fs.existsSync(uploadDir)).toBe(true);
    });

    it('creates profile folder under upload folder', () => {
        createFolders();

        const profileFolder = path.join('.', uploadDir, profileDir);

        expect(fs.existsSync(profileFolder)).toBe(true);
    });
});
