import { Router } from 'express';
import { DatastoreService } from '../services/datastore';
import { jwtGuard } from '../middleware/auth';
import { Task } from '../models';
import crypto from 'crypto';

const router = Router();

function parseISOOrThrow(value: unknown, field = 'dateTime'): string {
  if (typeof value !== 'string') throw new Error(`${field} must be a string`);
  const d = new Date(value);
  if (isNaN(d.getTime())) throw new Error(`${field} must be ISO-8601`);
  return d.toISOString();   // normalised
}

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

/* Helper's committed tasks */
router.get(
  '/my-committed',
  jwtGuard('helper'),
  async (req, res, next) => {
    try {
      const tasks = await DatastoreService.listTasks({ assignedTo: (req as any).user.id });
      res.json(tasks);
    } catch (err) { next(err); }
  }
);

router.post(
  '/propose',
  jwtGuard('helper'),
  async (req, res, next): Promise<void> => {
    try {
      const { title, description } = req.body;
      if (!title || !description) {
        res.status(400).json({ error: 'title and description are required' });
        return;
      }

      const proposed: Task = {
        id: crypto.randomUUID(),
        createdBy: (req as any).user.id,      // helper’s ID
        category: 'Proposed',
        description,
        title,                                // add `title` to Task model if missing
        dateTime: parseISOOrThrow(new Date().toISOString()),
        urgency: 'Low',
        status: 'proposed',                   // new status
      };

      await DatastoreService.saveTask(proposed);
      res.status(201).json({ message: 'Task proposed', taskId: proposed.id });
      return;
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  '/recurring',
  jwtGuard('sheila'),
  async (req, res, next): Promise<void> => {
    try {
      const { category, description, startDateTime, urgency, recurrence } = req.body;
      if (!category || !description || !startDateTime || !recurrence) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const task: Task = {
        id: crypto.randomUUID(),
        createdBy: (req as any).user.id,
        category,
        description,
        dateTime: parseISOOrThrow(startDateTime),
        urgency,
        status: 'recurring',
        recurrence,           // frequency, interval, endDate
      };

      await DatastoreService.saveTask(task);
      res.status(201).json({ message: 'Recurring task created', recurringTaskId: task.id });
      return;
    } catch (err) {
      return next(err);
    }
  }
);

router.get(
  '/available-recurring-definitions',
  jwtGuard('helper'),
  async (_req, res, next): Promise<void> => {
    try {
      // show every series Sheila has posted that is still “recurring”.
      // no createdBy filter ⇒ helpers can see Sheila’s jobs
      const defs = await DatastoreService.listTasks({ status: 'recurring' });
      res.json(defs);
    } catch (err) {
      next(err);
    }
  }
);

/* List Sheila’s recurring task templates */
router.get(
  '/recurring/definitions',
  jwtGuard('sheila', 'helper', 'admin'),
  async (req, res, next): Promise<void> => {
    try {
      const tasks = await DatastoreService.listTasks({
        createdBy: (req as any).user.id,
        status: 'recurring',
      });
      res.json(tasks);          // [{ id, category, recurrence:{…}, … }]
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
