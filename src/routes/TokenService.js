import jwt from 'jsonwebtoken';

const createToken = (user) => {
    return jwt.sign({ id: user.id }, process.env.jwt_secrets);
};

export default createToken;
