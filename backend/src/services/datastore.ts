import { Datastore } from '@google-cloud/datastore';
import { User, Task, Feedback, BulletinPost } from '../models';

/* Use the “sheilas-helpers” namespace for all entities */
const ds = new Datastore({ namespace: 'sheilas-helpers' });

export const DatastoreService = {
  /* Users */
  async getUserById(id: string): Promise<User | undefined> {
    const [entity] = await ds.get(ds.key(['User', id]));
    return entity as User | undefined;
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    const q = ds.createQuery('User').filter('email', email).limit(1);
    const [[entity]] = await q.run();
    return entity as User | undefined;
  },

  saveUser(user: User) {
    return ds.save({ key: ds.key(['User', user.id]), data: user });
  },

  /* Tasks */
  async saveTask(task: Task) {
    return ds.save({ key: ds.key(['Task', task.id]), data: task });
  },

  async getTask(id: string): Promise<Task | undefined> {
    const [entity] = await ds.get(ds.key(['Task', id]));
    return entity as Task | undefined;
  },

  async listTasks(filter: Partial<Task> = {}) {
    let q = ds.createQuery('Task');
    Object.entries(filter).forEach(([k, v]) => (q = q.filter(k, v)));
    const [arr] = await q.run();
    return arr as Task[];
  },

  /* Feedback */
  async saveFeedback(fb: Feedback) {
    return ds.save({ key: ds.key(['Feedback', fb.id]), data: fb });
  },

  async saveBulletin(post: BulletinPost) {
  return ds.save({ key: ds.key(['Bulletin', post.id]), data: post });
},

async listBulletin(): Promise<BulletinPost[]> {
  const [arr] = await ds.createQuery('Bulletin')
                         .order('createdAt', { descending: true })
                         .run();
  return arr as BulletinPost[];
},


};
