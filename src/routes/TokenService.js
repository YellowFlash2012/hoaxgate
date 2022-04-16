import Token from '../models/Token.js';
import randomString from '../shared/generator.js';

export const createToken = async (user) => {
    const token = randomString(32);

    await Token.create({
        token: token,
        userId: user.id,
    });

    return token;
};

export const verify = async (token) => {
    const tokenInDB = await Token.findOne({ where: { token: token } });

    const userId = tokenInDB.userId;

    return { id: userId };
};

export const deleteToken = async (token) => {
    await Token.destroy({ where: { token: token } });
};
