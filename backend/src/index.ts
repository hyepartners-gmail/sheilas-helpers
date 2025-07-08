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

import path from 'path';
// import { fileURLToPath } from 'url';

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

// const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.join(__dirname, 'public');

app.use(express.static(staticDir));          // serve /public
app.get('*', (_req, res) =>                  // SPA fallback
  res.sendFile(path.join(staticDir, 'index.html'))
);

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
