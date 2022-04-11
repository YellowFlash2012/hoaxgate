import User from "../models/Users.js";
import bcrypt from "bcrypt"
import sendAccountActivation from './EmailService.js';
import EmailException from "./EmailException.js"
import { Sequelize } from "sequelize";
import sequelize from "../config/db.js";
import invalidTokenException from "./invalidTokenException.js";
import randomString from "../shared/generator.js";

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
        throw new invalidTokenException()
    }

    user.inactive = false;
    user.activationToken = null;

    await user.save();
}

export const getUsers = async () => {
  return {
    content: [],
    page: 0,
    size: 10,
    totalPages: 0,
  };
};

