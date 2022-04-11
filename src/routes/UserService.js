import User from "../models/Users.js";
import bcrypt from "bcrypt"
import sendAccountActivation from './EmailService.js';
import EmailException from "./EmailException.js"
import { Sequelize } from "sequelize";
import sequelize from "../config/db.js";
import invalidTokenException from "./invalidTokenException.js";
import randomString from "../shared/generator.js";
import UserNotFoundException from './UserNotFoundException.js';

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

export const getUsers = async (page, size) => {
  const usersCount = await User.findAndCountAll({
    where: { inactive: false },
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

