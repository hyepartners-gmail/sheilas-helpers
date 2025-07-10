import { Router } from 'express';
import { DatastoreService } from '../services/datastore';
import { jwtGuard } from '../middleware/auth';
import crypto from 'crypto'; 
import { Feedback } from '../models';

const router = Router();

/* GET /api/user/me */
router.get(
  '/me',
  jwtGuard(),                                // any authenticated role
  async (req, res, next): Promise<void> => {
    try {
      const user = await DatastoreService.getUserById((req as any).user.id);
      if (!user) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.json(user);
      return;
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  '/feedback',
  jwtGuard('helper'),
  async (req, res, next): Promise<void> => {
    try {
      const { message } = req.body;
      if (!message) {
        res.status(400).json({ error: 'message is required' });
        return;
      }

      const fb: Feedback = {
        id: crypto.randomUUID(),
        helperId: (req as any).user.id,
        message,
        createdAt: new Date().toISOString(),
      };

      await DatastoreService.saveFeedback(fb);
      res.status(201).json({ message: 'Feedback submitted successfully.' });
      return;
    } catch (err) {
      return next(err);
    }
  }
);

/* PUT /api/users/profile */
router.put(
  '/profile',
  jwtGuard('helper', 'sheila'),
  async (req, res, next): Promise<void> => {
    try {
      const id = (req as any).user.id;
      const user = await DatastoreService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      Object.assign(user, req.body);          // phoneNumber, availability, etc.
      await DatastoreService.saveUser(user);
      res.json(user);
      return;
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
