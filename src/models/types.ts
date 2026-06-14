export type FrequencyType = 'daily' | 'weekly' | 'monthly';

export interface Habit {
  id: string;
  name: string;
  category: string;
  frequencyType: FrequencyType;
  targetCount: number;
  isPinned: boolean;       // pinned to dashboard; replaces showOnDashboard
  showOnDashboard: boolean; // kept for migration compatibility
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
