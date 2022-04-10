import User from "./Users.js";
import bcrypt from "bcrypt"
import EmailService from "./EmailService.js"
import { Sequelize } from "sequelize";
import sequelize from "../config/db.js";
import invalidTokenException from "./invalidTokenException.js";

const save = async (body) => {
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
    await EmailService.sendAccountActivation(email, user.activationToken);
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
        throw new InvalidTokenException()
    }

    user.inactive = false;
    user.activationToken = null;

    await user.save();
}

export default save