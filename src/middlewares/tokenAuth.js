import { verify } from '../routes/TokenService.js';

const tokenAuth = async (req, res, next) => {
    const auth = req.headers.authorization;

    if (auth) {
        const token = auth.substring(7);

        try {
            const user = await verify(token);

            req.authenticatedUser = user;
        } catch (error) {}
    }

    next();
};

export default tokenAuth;
