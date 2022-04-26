import fs from 'fs';
import path from 'path';

import config from 'config';
import randomString from '../shared/generator.js';
import FileAttachment from '../models/FileAttachment.js';
// import { fileTypeFromBuffer } from 'file-type';

const { uploadDir, profileDir, attachmentDir } = config;
const profileFolder = path.join('.', uploadDir, profileDir);
const attachmentFolder = path.join('.', uploadDir, attachmentDir);

export const createFolders = () => {
    // const uploadDir = 'upload';

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }

    if (!fs.existsSync(profileFolder)) {
        fs.mkdirSync(profileFolder);
    }

    if (!fs.existsSync(attachmentFolder)) {
        fs.mkdirSync(attachmentFolder);
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

export const isLessThan2MB = (buffer) => {
    return buffer.length < 2 * 1024 * 1024;
};

export const isSupportedFileType = async (buffer) => {
    // !type in case file type is undefined
    const type = await fileTypeFromBuffer(buffer);
    console.log(type);

    return !type
        ? false
        : type.mime === 'image/png' || type.mime === 'image/jpeg';
};

export const saveAttachment = async (file) => {
    const filename = randomString(32);

    await fs.promises.writeFile(path.join(attachmentFolder, filename), file);
    await FileAttachment.create({
        filename: randomString(32),
        uploadDate: new Date(),
    });
};