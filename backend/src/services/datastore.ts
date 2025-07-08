import { Datastore } from '@google-cloud/datastore';
import { User, Task } from '../models';

const ds = new Datastore();

export const DatastoreService = {
  /* Users */
  async getUserById(id: string) {
    const [u] = await ds.lookup(ds.key(['User', id]));
    return u as User | undefined;
  },
  async getUserByEmail(email: string) {
    const q = ds.createQuery('User').filter('email', email).limit(1);
    const [r] = await q.run();
    return r[0] as User | undefined;
  },
  saveUser(user: User) {
    const key = ds.key(['User', user.id]);
    return ds.save({ key, data: user });
  },

  /* Tasks */
  async saveTask(task: Task) {
    const key = ds.key(['Task', task.id]);
    return ds.save({ key, data: task });
  },
  async getTask(id: string) {
    const [t] = await ds.lookup(ds.key(['Task', id]));
    return t as Task | undefined;
  },
  async listTasks(filter: Partial<Task> = {}) {
    let q = ds.createQuery('Task');
    Object.entries(filter).forEach(([k, v]) => q = q.filter(k, v));
    const [arr] = await q.run();
    return arr as Task[];
  },
};
