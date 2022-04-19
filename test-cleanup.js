import path from 'path';
import fs from 'fs';
import config from 'config';

const { uploadDir, profileDir } = config;
const profileDirectory = path.join('.', uploadDir, profileDir);

// to clear the image test folder

const files = fs.readdirSync(profileDirectory);

for (const file of files) {
    fs.unlinkSync(path.join(profileDirectory, file));
}
