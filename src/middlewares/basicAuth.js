import bcrypt from 'bcrypt';

import { findByEmail } from '../routes/UserService.js';

const basicAuth = async (req, res, next) => {
    const auth = req.headers.authorization;

    if (auth) {
        const encoded = auth.substring(6);
        const decoded = Buffer.from(encoded, 'base64').toString('ascii');

        const [email, password] = decoded.split(':');

        const user = await findByEmail(email);

        if (user && !user.inactive) {
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                req.authenticatedUser = user;
            }
        }
    }

    next();
};

export default basicAuth;
