import { Router } from 'express';
import { DatastoreService } from '../services/datastore';
import { jwtGuard } from '../middleware/auth';
import { Task } from '../models';
import crypto from 'crypto';

const router = Router();

/* Create task */
router.post(
  '/',
  jwtGuard('sheila'),
  async (req, res, next): Promise<void> => {
    try {
      const task: Task = {
        id: crypto.randomUUID(),
        createdBy: (req as any).user.id,
        status: 'open',
        ...req.body,
      };
      await DatastoreService.saveTask(task);
      res.status(201).json(task);
      return;
    } catch (err) {
      return next(err);
    }
  }
);

/* List tasks */
router.get(
  '/',
  jwtGuard('sheila'),
  async (req, res, next): Promise<void> => {
    try {
      const tasks = await DatastoreService.listTasks({ createdBy: (req as any).user.id });
      res.json(tasks);
      return;
    } catch (err) {
      return next(err);
    }
  }
);

/* Available tasks for helper */
router.get(
  '/available',
  jwtGuard('helper'),
  async (_req, res, next): Promise<void> => {
    try {
      const tasks = await DatastoreService.listTasks({ status: 'open' });
      res.json(tasks);
      return;
    } catch (err) {
      return next(err);
    }
  }
);

/* Commit to task */
router.post(
  '/:id/commit',
  jwtGuard('helper'),
  async (req, res, next): Promise<void> => {
    try {
      const task = await DatastoreService.getTask(req.params.id);
      if (!task || task.status !== 'open') {
        res.status(404).json({ error: 'Unavailable' });
        return;
      }
      task.status = 'committed';
      task.assignedTo = (req as any).user.id;
      await DatastoreService.saveTask(task);
      res.json(task);
      return;
    } catch (err) {
      return next(err);
    }
  }
);

/* Mark complete */
router.post(
  '/:id/complete',
  jwtGuard('helper', 'sheila'),
  async (req, res, next): Promise<void> => {
    try {
      const task = await DatastoreService.getTask(req.params.id);
      if (!task) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      task.status = 'completed';
      await DatastoreService.saveTask(task);
      res.json(task);
      return;
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
