import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { DatastoreService } from '../services/datastore';
import { User } from '../models';

/* ─────────────────── Serialize / Deserialize ─────────────────── */

passport.serializeUser((user: any, done) => done(null, user.id));

passport.deserializeUser(async (id: string, done) => {
  const user = await DatastoreService.getUserById(id);
  done(null, user ?? false);
});

/* ────────────────────── Google OAuth 2.0 ─────────────────────── */

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.API_BASE_URL}/auth/google/callback`,
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: GoogleProfile,
      done: (err: any, user?: any) => void
    ): Promise<void> => {
      try {
        const email = profile.emails?.[0]?.value ?? '';
        const existing = email ? await DatastoreService.getUserByEmail(email) : undefined;
        if (existing) return done(null, existing);

        const user: User = {
          id: profile.id,
          name: profile.displayName,
          email,
          role: 'helper',
          phoneNumber: '',
        };
        await DatastoreService.saveUser(user);
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

/* ──────────────────── Email / Password Login ─────────────────── */

passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done): Promise<void> => {
      try {
        const user = await DatastoreService.getUserByEmail(email);
        if (!user) return done(null, false, { message: 'No user' });

        const ok = await bcrypt.compare(password, user.passwordHash!);
        if (!ok) return done(null, false, { message: 'Bad credentials' });

        return done(null, user);
      } catch (err) {
        return done(err as any);
      }
    }
  )
);
