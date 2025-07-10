import { Router } from 'express';
import { GmailService, oauth2Client } from '../services/gmail';
import { jwtGuard } from '../middleware/auth';
import { DatastoreService } from '../services/datastore';
import { Task } from '../models';


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

/* Helper engagement metrics */
router.get(
  '/insights/helper-engagement',
  jwtGuard('admin','helper', 'sheila'),
  async (_req, res, next): Promise<void> => {
    try {
      // fetch all committed or completed tasks
      const tasks = await DatastoreService.listTasks({});   // no filter
      const counts: Record<string, number> = {};

        tasks.forEach((t: Task) => {           // ← annotate t
        if (t.assignedTo) {
            counts[t.assignedTo] = (counts[t.assignedTo] || 0) + 1;
        }
        });

      /* return [{ helperId, totalTasks }] sorted desc */
      const data = Object.entries(counts)
        .map(([helperId, totalTasks]) => ({ helperId, totalTasks }))
        .sort((a, b) => b.totalTasks - a.totalTasks);

      res.json(data);
      return;
    } catch (err) {
      return next(err);
    }
  }
);


export default router;
