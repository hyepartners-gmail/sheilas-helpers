import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { DatastoreService } from '../services/datastore';
import { User } from '../models';

const router = Router();

/* ===== Google OAuth ===== */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign(req.user as any, process.env.JWT_SECRET!, { expiresIn: '7d' });
    res.redirect(`${process.env.FRONTEND_URL}/auth/finish?token=${token}`);
  });

/* ===== Local signup ===== */
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, name, phoneNumber, role } = req.body;
    if (await DatastoreService.getUserByEmail(email)) return res.status(409).json({ error: 'Exists' });
    const user: User = {
      id: crypto.randomUUID(),
      email,
      name,
      phoneNumber,
      role,
      passwordHash: await bcrypt.hash(password, 10),
    };
    await DatastoreService.saveUser(user);
    const token = jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) { next(err); }
});

/* ===== Local login ===== */
router.post('/login',
  passport.authenticate('local', { session: false }),
  (req, res) => {
    const token = jwt.sign(req.user as any, process.env.JWT_SECRET!, { expiresIn: '7d' });
    res.json({ token, user: req.user });
  }
);

export default router;
