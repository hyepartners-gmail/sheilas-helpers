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

export interface Task {
  id: string;
  createdBy: string;          // Sheila ID
  category: string;
  description: string;
  dateTime: string;           // ISO
  urgency: 'Low' | 'Medium' | 'High';
  recurrence?: 'daily' | 'weekly' | 'monthly';
  assignedTo?: string;        // Helper ID
  status: 'open' | 'committed' | 'completed';
}
