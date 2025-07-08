import { Router } from 'express';
import { DatastoreService } from '../services/datastore';
import { jwtGuard } from '../middleware/auth';
import { Task } from '../models';

const router = Router();

/* Create task */
router.post('/', jwtGuard('sheila'), async (req, res, next) => {
  try {
    const task: Task = {
      id: crypto.randomUUID(),
      createdBy: (req as any).user.id,
      status: 'open',
      ...req.body,
    };
    await DatastoreService.saveTask(task);
    res.status(201).json(task);
  } catch (err) { next(err); }
});

/* List tasks */
router.get('/', jwtGuard('sheila'), async (req, res, next) => {
  try {
    const tasks = await DatastoreService.listTasks({ createdBy: (req as any).user.id });
    res.json(tasks);
  } catch (err) { next(err); }
});

/* Available tasks for helper */
router.get('/available', jwtGuard('helper'), async (_req, res, next) => {
  try {
    const tasks = await DatastoreService.listTasks({ status: 'open' });
    res.json(tasks);
  } catch (err) { next(err); }
});

/* Commit to task */
router.post('/:id/commit', jwtGuard('helper'), async (req, res, next) => {
  try {
    const task = await DatastoreService.getTask(req.params.id);
    if (!task || task.status !== 'open') return res.status(404).json({ error: 'Unavailable' });
    task.status = 'committed';
    task.assignedTo = (req as any).user.id;
    await DatastoreService.saveTask(task);
    res.json(task);
  } catch (err) { next(err); }
});

/* Mark complete */
router.post('/:id/complete', jwtGuard('helper', 'sheila'), async (req, res, next) => {
  try {
    const task = await DatastoreService.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Not found' });
    task.status = 'completed';
    await DatastoreService.saveTask(task);
    res.json(task);
  } catch (err) { next(err); }
});

export default router;
