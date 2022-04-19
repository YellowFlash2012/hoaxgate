import fs from 'fs';
import path from 'path';

import config from 'config';
import randomString from '../shared/generator.js';
const { uploadDir, profileDir } = config;
const profileFolder = path.join('.', uploadDir, profileDir);

export const createFolders = () => {
    // const uploadDir = 'upload';

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }

    if (!fs.existsSync(profileFolder)) {
        fs.mkdirSync(profileFolder);
    }
};

export const saveProfileImg = async (base64File) => {
    const filename = randomString(32);
    const filePath = path.join(profileFolder, filename);

    await fs.promises.writeFile(filePath, String(base64File), 'base64');
    return filename;
};

export const deleteProfileImage = async (filename) => {
    const filePath = path.join(profileFolder, filename);
    await fs.promises.unlink(filePath);
};