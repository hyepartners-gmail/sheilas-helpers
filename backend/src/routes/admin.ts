import { Router } from 'express';
import { GmailService, oauth2Client } from '../services/gmail';
import { jwtGuard } from '../middleware/auth';

const router = Router();

/* Step 1: redirect admin to Google consent */
router.get(
  '/gmail/connect',
  jwtGuard('admin'),
  (_req, res): void => {
    res.redirect(GmailService.createAuthUrl());
    return;
  }
);

/* Step 2: OAuth callback stores tokens */
router.get(
  '/gmail/callback',
  async (req, res, next): Promise<void> => {
    try {
      const { code } = req.query;

      if (typeof code !== 'string') {
        res.status(400).json({ error: 'Missing code' });
        return;
      }

      const { tokens } = await oauth2Client.getToken(code);
      await GmailService.storeTokens(tokens);

      res.json({ message: 'Gmail connected' });
      return;
    } catch (err) {
      next(err);
      return;
    }
  }
);

/* Send test email */
router.post(
  '/gmail/test',
  jwtGuard('admin'),
  async (req, res, next): Promise<void> => {
    try {
      const { recipientEmail, subject, body } = req.body;
      await GmailService.sendEmail([recipientEmail], subject, body);
      res.json({ success: true });
      return;
    } catch (err) {
      next(err);
      return;
    }
  }
);

export default router;
