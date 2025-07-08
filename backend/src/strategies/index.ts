import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { DatastoreService } from '../services/datastore';
import { User } from '../models';

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  const user = await DatastoreService.getUserById(id);
  done(null, user ?? false);
});

/* Google OAuth */
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `${process.env.API_BASE_URL}/auth/google/callback`,
  },
  async (_accessToken, _refreshToken, profile, done) => {
    const existing = await DatastoreService.getUserByEmail(profile.emails?.[0]?.value ?? '');
    if (existing) return done(null, existing);

    const user: User = {
      id: profile.id,
      name: profile.displayName,
      email: profile.emails?.[0]?.value ?? '',
      role: 'helper',
      phoneNumber: '',
    };
    await DatastoreService.saveUser(user);
    done(null, user);
  }
));

/* Email & Password */
passport.use(new LocalStrategy(
  { usernameField: 'email', passwordField: 'password' },
  async (email, password, done) => {
    const user = await DatastoreService.getUserByEmail(email);
    if (!user) return done(null, false, { message: 'No user' });
    const ok = await bcrypt.compare(password, user.passwordHash!);
    if (!ok) return done(null, false, { message: 'Bad credentials' });
    return done(null, user);
  }
));
