import Sequelize from 'sequelize';
import Token from '../models/Token.js';
import randomString from '../shared/generator.js';

const oneWeekInMillis = 7 * 24 * 60 * 60 * 1000;

export const createToken = async (user) => {
    const token = randomString(32);

    await Token.create({
        token: token,
        userId: user.id,
        lastUsedAt: new Date(),
    });

    return token;
};

export const verify = async (token) => {
    // Op=operator
    // gt= greater than
    const oneWeekAgo = new Date(Date.now() - oneWeekInMillis);

    const tokenInDB = await Token.findOne({
        where: {
            token: token,
            lastUsedAt: {
                [Sequelize.Op.gt]: oneWeekAgo,
            },
        },
    });

    tokenInDB.lastUsedAt = new Date();
    await tokenInDB.save();

    const userId = tokenInDB.userId;

    return { id: userId };
};

export const deleteToken = async (token) => {
    await Token.destroy({ where: { token: token } });
};

export const scheduledCleanup = () => {
    // Op=operator
    // lt= less than

    setInterval(async () => {
        console.log('running cleanup');
        const oneWeekAgo = new Date(Date.now() - oneWeekInMillis);

        await Token.destroy({
            where: {
                lastUsedAt: {
                    [Sequelize.Op.lt]: oneWeekAgo,
                },
            },
        });
    }, 60 * 60 * 1000);
};

export const clearTokens = async (userId) => {
    await Token.destroy({ where: { userId: userId } });
};