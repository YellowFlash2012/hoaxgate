import express from 'express';
import bcrypt from 'bcrypt';
import AuthException from './AuthException.js';
import { findByEmail } from './UserService.js';
import ForbiddenException from './ForbiddenException.js';
import { check, validationResult } from 'express-validator';

import { createToken, deleteToken } from './TokenService.js';

const router = express.Router();

router.post('/', check('email').isEmail(), async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AuthException());
    }

    const { email, password } = req.body;
    const user = await findByEmail(email);

    // user not found exception
    if (!user) {
        // return res.status(401).send();
        return next(new AuthException());
    }

    // passwords don't match exceptions
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return next(new AuthException());
    }

    // inactive user exception
    if (user.inactive) {
        return next(new ForbiddenException());
    }

    const token = await createToken(user);

    res.send({
        id: user.id,
        username: user.username,
        token,
        image: user.image,
    });
});

router.post('/logout', async (req, res) => {
    const auth = req.headers.authorization;

    if (auth) {
        const token = auth.substring(7);

        await deleteToken(token);
    }
    res.send();
});

export default router;
