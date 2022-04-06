import express from "express";

import User from '../models/Users.js';
import bcrypt from 'bcrypt';

const router = express.Router()

router.post('/', async (req, res) => {

    const hash = await bcrypt.hash(req.body.password, 10);
  
    const user = {
      username: req.body.username,
      email: req.body.email,
      password: hash,
    };

    await User.create(user); 
    
    return res.send({ message: 'User created' });
    
  
});

export default router