import { Router } from 'express';
import crypto from 'crypto';
import { DatastoreService } from '../services/datastore';
import { jwtGuard } from '../middleware/auth';
import { BulletinPost } from '../models';

const router = Router();

/* POST /api/bulletin  (Sheila only) */
router.post('/', jwtGuard('sheila'), async (req, res, next) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: 'title and content are required' });
      return;
    }

    const post: BulletinPost = {
      id: crypto.randomUUID(),
      title,
      content,
      authorId: (req as any).user.id,
      createdAt: new Date().toISOString(),
    };

    await DatastoreService.saveBulletin(post);
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

/* GET /api/bulletin  (any signed-in user) */
router.get('/', jwtGuard(), async (_req, res, next) => {
  try {
    const posts = await DatastoreService.listBulletin();
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

export default router;
