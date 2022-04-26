import NotFoundException from '../error/NotFoundException.js';
import Hoax from '../models/Hoax.js';
import User from '../models/Users.js';

export const save = async (body, user) => {
    const hoax = {
        content: body.content,
        timestamp: Date.now(),
        userId: user.id,
    };
    await Hoax.create(hoax);
};

export const getHoaxes = async (page, size, userId) => {
    let where = {};
    if (userId) {
        const user = await User.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException('User Not Found!');
        }
        where = { id: userId };
    }
    const hoaxesCount = await Hoax.findAndCountAll({
        attributes: ['id', 'content', 'timestamp'],
        include: {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'image'],
            where: where,
        },
        order: [['id', 'DESC']],
        limit: size,
        offset: page * size,
    });

    return {
        content: hoaxesCount.rows,
        page,
        size,
        totalPages: Math.ceil(hoaxesCount.count / size),
    };
};
