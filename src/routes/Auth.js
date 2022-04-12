import express from 'express';
import { findByEmail } from './UserService';
const router = express.Router();

router.post('/', async (req, res) => {
  const { email } = req.body;
  const user = await findByEmail(email);

  res.send({
    id: user.id,
    username: user.username,
  });
});

export default router;
