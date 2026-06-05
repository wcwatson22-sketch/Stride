export type FrequencyType = 'daily' | 'weekly' | 'monthly';

export interface Habit {
  id: string;
  name: string;
  category: string;
  frequencyType: FrequencyType;
  targetCount: number;
  showOnDashboard: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  completedAt: string;
  count: number;
  note: string;
  createdAt: string;
}
