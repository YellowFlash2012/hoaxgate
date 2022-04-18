import fs from 'fs';
import path from 'path';

import config from 'config';

const createFolders = () => {
    const { uploadDir, profileDir } = config;

    // const uploadDir = 'upload';

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }

    const profileFolder = path.join('.', uploadDir, profileDir);
    if (!fs.existsSync(profileFolder)) {
        fs.mkdirSync(profileFolder);
    }
};

export default createFolders;
