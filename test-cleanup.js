import path from 'path';
import fs from 'fs';
import config from 'config';

const { uploadDir, profileDir, attachmentDir } = config;
const profileDirectory = path.join('.', uploadDir, profileDir);
const attachmentDirectory = path.join('.', uploadDir, attachmentDir);

// to clear the image test folder
const clearFolders = (folder) => {
    const files = fs.readdirSync(folder);

    for (const file of files) {
        fs.unlinkSync(path.join(folder, file));
    }
};

clearFolders(profileDir);
clearFolders(attachmentDir);