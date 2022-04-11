import express from "express";

import User from '../models/Users.js';

import { check, validationResult } from 'express-validator';

import { save, activate, getUsers, findByEmail } from './UserService.js';

import validationException from '../error/validationException.js';

const router = express.Router();

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
    .withMessage('Email is NOT valid')
    .bail()
    .custom(async (email) => {
      const user = await findByEmail(email);

      if (user) {
        throw new Error('Email already used');
      }
    }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new validationException(errors.array()));
    }

    try {
      await save(req.body);
      return res.send({ message: 'User created' });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/token/:token', async (req, res, next) => {
  const token = req.params.token;

  try {
    await activate(token);
    return res.send({ message: 'Account successfully activated!' });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res) => {
  const users = await getUsers();

  res.send(users);
});

export default router