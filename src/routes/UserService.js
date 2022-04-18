import User from '../models/Users.js';
import bcrypt from 'bcrypt';
import { sendAccountActivation, sendPasswordReset } from './EmailService.js';
import EmailException from './EmailException.js';
import { Sequelize } from 'sequelize';
import sequelize from '../config/db.js';
import invalidTokenException from './invalidTokenException.js';
import randomString from '../shared/generator.js';
import UserNotFoundException from './UserNotFoundException.js';
import NotFoundException from '../error/NotFoundException.js';
import { clearTokens } from './TokenService.js';

export const save = async (body) => {
    const { username, email, password } = body;
    const hash = await bcrypt.hash(password, 10);
    const user = {
        username,
        email,
        password: hash,
        activationToken: randomString(16),
    };

    const transaction = await sequelize.transaction();

    await User.create(user, { transaction });
    try {
        await sendAccountActivation(email, user.activationToken);
        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw new EmailException();
    }
};

export const findByEmail = async (email) => {
    return await User.findOne({ where: { email: email } });
};

export const activate = async (token) => {
    const user = await User.findOne({ where: { activationToken: token } });

    if (!user) {
        throw new invalidTokenException();
    }

    user.inactive = false;
    user.activationToken = null;

    await user.save();
};

export const getUsers = async (page, size, authenticatedUser) => {
    const usersCount = await User.findAndCountAll({
        where: {
            inactive: false,
            id: {
                [Sequelize.Op.not]: authenticatedUser
                    ? authenticatedUser.id
                    : 0,
            },
        },

        attributes: ['id', 'username', 'email'],
        limit: size,
        offset: page * size,
    });

    return {
        content: usersCount.rows,
        page,
        size,
        totalPages: Math.ceil(usersCount.count / size),
    };
};

export const getUser = async (id) => {
    const user = await User.findOne({
        where: { id: id, inactive: false },
        attributes: ['id', 'username', 'email'],
    });

    if (!user) {
        throw new UserNotFoundException();
    }

    return user;
};

export const updateUser = async (id, updatedBody) => {
    const user = await User.findOne({ where: { id: id } });

    user.username = updatedBody.username;

    await user.save();
};

export const deleteUser = async (id) => {
    await User.destroy({ where: { id: id } });
};

export const passwordResetRequest = async (email) => {
    const user = await findByEmail(email);

    if (!user) {
        throw new NotFoundException(
            'Unknown email, please enter a correct email!'
        );
    }
    user.passwordResetToken = randomString(16);
    await user.save();

    try {
        await sendPasswordReset(email, user.passwordResetToken);
    } catch (error) {
        throw new EmailException();
    }
};

export const updatePassword = async (updateReq) => {
    const user = await User.findOne({
        where: { passwordResetToken: updateReq.passwordResetToken },
    });

    const hash = await bcrypt.hash(updateReq.password, 10);

    user.password = hash;

    // clears the reset token in DB when req is valid
    user.passwordResetToken = null;

    // activates & clears activation token if account is inactive
    user.inactive = false;
    user.activationToken = null;

    await user.save();

    await clearTokens(user.id);
};