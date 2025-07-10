export type Role = 'sheila' | 'helper' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phoneNumber: string;
  passwordHash?: string;
  generalAvailability?: string[];
  preferredTasks?: string[];
}

export interface Recurrence {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;          // 1 = every week, 2 = every 2 weeks, etc.
  endDate?: string;          // ISO
}

export interface Task {
  id: string;
  createdBy: string;
  category: string;
  title?: string;
  description: string;
  dateTime: string;                // first occurrence or one-shot
  urgency: 'Low' | 'Medium' | 'High';
  status: 'open' | 'committed' | 'completed' | 'proposed' | 'recurring';
  assignedTo?: string;
  recurrence?: Recurrence;         // ← add
}

export interface Feedback {
  id: string;
  helperId: string;
  message: string;
  createdAt: string;         // ISO timestamp
}

// src/models/index.ts  (append)
export interface BulletinPost {
  id: string;
  title: string;
  content: string;
  authorId: string;          // Sheila’s user ID
  createdAt: string;         // ISO timestamp
}
