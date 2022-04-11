import express from "express";

import User from '../models/Users.js';
import bcrypt from 'bcrypt';
import { check, validationResult } from "express-validator";
import crypto from "crypto"
import nodemailer from "nodemailer"
import * as UserService from "./UserService.js"
import { nextTick } from "process";
import validationException from "../error/validationException.js";



const router = express.Router()



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
  async (req, res, next) => {
    // const { username, email, password } = req.body;
    // const hash = await bcrypt.hash(password, 10);

    // const user = {
    //     username: username,
    //     email: email,
    //     password: hash,
    //     activationToken:generateToken(19)
    // };

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      

      return next(new validationException(errors.array()))
    }

    try {
      // await User.create(user);
      await UserService.save(req.body);
      return res.send({ message: 'User created' });
    } catch (error) {
      // return res.status(502).send({message:"Email failure"});
      next(error)
    }
    
  
  }
);

router.post("/api/1.0/users/token/:token", async (req, res, next) => {
  const token = req.params.token;

  try {
    await UserService.activate(token);
    return res.send({message:"Account successfully activated!"})
  } catch (error) {
    // return res.status(400).send({message:"Account activation failed"});
    next(error)
  }

})

export default router