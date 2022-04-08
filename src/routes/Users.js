import express from "express";

import User from '../models/Users.js';
import bcrypt from 'bcrypt';
import { check, validationResult } from "express-validator";

const router = express.Router()

// const validateUsername = async (req, res, next) => {
//     const hash = await bcrypt.hash(req.body.password, 10);

//     const user = {
//         username: req.body.username,
//         email: req.body.email,
//         password: hash,
//   };

//     if (user.username == null) {
//     req.validationErrors = { username: 'username can NOT be null' };
//     }
//     next()
// };

// const validateEmail = async (req, res, next) => {
//     const hash = await bcrypt.hash(req.body.password, 10);

//     const user = {
//         username: req.body.username,
//         email: req.body.email,
//         password: hash,
//   };

//   if (user.email == null) {
//     req.validationErrors = { ...req.validationErrors, email: 'email can NOT be null' };
//   }
//     next()
// };

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
    .withMessage('Email is NOT valid'),
  async (req, res) => {
    const hash = await bcrypt.hash(req.body.password, 10);

    const user = {
      username: req.body.username,
      email: req.body.email,
      password: hash,
    };
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = {};
      errors
        .array()
        .forEach((error) => (validationErrors[error.param] = error.msg));
      return res.status(400).send({ validationErrors: validationErrors });
    }

    await User.create(user);

    return res.send({ message: 'User created' });
  }
);

export default router