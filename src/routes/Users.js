import express from "express";

import User from '../models/Users.js';
import bcrypt from 'bcrypt';
import { check, validationResult } from "express-validator";
import crypto from "crypto"
import nodemailer from "nodemailer"
import UserService from "./UserService.js"


const router = express.Router()

const generateToken = (length) => {
    return crypto.randomBytes(length).toString('hex').substring(0, length);
};

router.post(
  '/',
  check('username')
    .notEmpty()
    .withMessage('Username can NOT be null')
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage('Username must have min 4 and max of 32 characters'),
  check('password')
    .notEmpty()
    .withMessage('Password can NOT be null')
    .bail()
    .isLength({ min: 13 })
    .withMessage('Password must be at least 13 characters long')
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage(
      'Password must have at least 1 uppercase, 1 lowercase and 1 number'
    ),
  check('email')
    .notEmpty()
    .withMessage('Email can NOT be null')
    .bail()
    .isEmail()
    .withMessage('Email is NOT valid').bail().custom(async (email) => {
      const user = await User.findOne({ where: { email: email } });

      if (user) {
        throw new Error('Email already used');
      }
    }),
  async (req, res) => {
    const { username, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);

    const user = {
        username: username,
        email: email,
        password: hash,
        activationToken:generateToken(19)
    };

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = {};
      errors
        .array()
        .forEach((error) => (validationErrors[error.param] = req.t(error.msg)));
      return res.status(400).send({ validationErrors: validationErrors });
    }

    const transporter = nodemailer.createTransport();
    await transporter.sendMail({
      from: 'My app<info@my-app.io>',
      to: email,
      subject: 'Account Activation',
      html: `Token is ${user.activationToken}`,
    });

    try {
      await User.create(user);
      return res.send({ message: 'User created' });
    } catch (error) {
      return res.status(502).send({message:"Email failure"});
    }
    
  
  }
);

router.post("/api/1.0/users/token/:token", async (req, res) => {
  const token = req.params.token;

  try {
    await UserService.activate(token);
  } catch (error) {
    return res.status(400).send();
  }
  res.send();
})

export default router