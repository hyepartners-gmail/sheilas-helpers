import { Router } from 'express';
import { GmailService } from '../services/gmail';
import { jwtGuard } from '../middleware/auth';

const router = Router();

/* Step 1: redirect admin to Google consent */
router.get('/gmail/connect', jwtGuard('admin'), (_req, res) => {
  res.redirect(GmailService.createAuthUrl());
});

/* Step 2: OAuth callback stores tokens */
router.get('/gmail/callback', async (req, res, next) => {
  try {
    const { code } = req.query;
    const { tokens } = await GmailService['oauth2Client'].getToken(code as string);
    await GmailService.storeTokens(tokens);
    res.json({ message: 'Gmail connected' });
  } catch (err) { next(err); }
});

/* Send test email */
router.post('/gmail/test', jwtGuard('admin'), async (req, res, next) => {
  try {
    const { recipientEmail, subject, body } = req.body;
    await GmailService.sendEmail([recipientEmail], subject, body);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
