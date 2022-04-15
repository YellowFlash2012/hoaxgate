import jwt from 'jsonwebtoken';

export const createToken = (user) => {
    return jwt.sign({ id: user.id }, process.env.jwt_secrets);
};

export const verify = (token) => {
    return jwt.verify(token, process.env.jwt_secrets);
};


