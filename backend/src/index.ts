import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
import dotenv from 'dotenv';

import './strategies';                       // registers Passport strategies
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import adminRoutes from './routes/admin';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Passport session (kept only for Google OAuth handshake)
app.use(session({ secret: process.env.SESSION_SECRET ?? 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/admin', adminRoutes);

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
