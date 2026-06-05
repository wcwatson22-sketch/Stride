import { Habit, HabitCompletion } from '../models/types';

export function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function getPeriodStart(habit: Habit, now: Date = new Date()): Date {
  switch (habit.frequencyType) {
    case 'daily':
      return getStartOfDay(now);
    case 'weekly':
      return getStartOfWeek(now);
    case 'monthly':
      return getStartOfMonth(now);
  }
}

export function getCompletedCountForPeriod(
  habit: Habit,
  completions: HabitCompletion[],
  now: Date = new Date()
): number {
  const periodStart = getPeriodStart(habit, now);
  return completions
    .filter(
      (c) =>
        c.habitId === habit.id && new Date(c.completedAt) >= periodStart
    )
    .reduce((sum, c) => sum + c.count, 0);
}

export function getHabitProgress(
  habit: Habit,
  completions: HabitCompletion[],
  now: Date = new Date()
): { completed: number; target: number; percentage: number; done: boolean } {
  const completed = getCompletedCountForPeriod(habit, completions, now);
  const target = habit.targetCount;
  const percentage = Math.min(1, completed / target);
  return { completed, target, percentage, done: completed >= target };
}

export function getTodayStats(
  habits: Habit[],
  completions: HabitCompletion[],
  now: Date = new Date()
): { completedActions: number; totalActions: number; percentage: number } {
  const dailyHabits = habits.filter((h) => h.isActive && h.frequencyType === 'daily');
  let completedActions = 0;
  let totalActions = 0;
  for (const habit of dailyHabits) {
    const { completed, target } = getHabitProgress(habit, completions, now);
    completedActions += Math.min(completed, target);
    totalActions += target;
  }
  return {
    completedActions,
    totalActions,
    percentage: totalActions > 0 ? completedActions / totalActions : 0,
  };
}

export function getWeeklyConsistency(
  habits: Habit[],
  completions: HabitCompletion[],
  now: Date = new Date()
): number {
  const activeHabits = habits.filter((h) => h.isActive);
  if (activeHabits.length === 0) return 0;

  let totalPossible = 0;
  let totalCompleted = 0;

  for (const habit of activeHabits) {
    if (habit.frequencyType === 'daily') {
      // Check each of the last 7 days
      for (let i = 0; i < 7; i++) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);
        const { completed, target } = getHabitProgress(habit, completions, day);
        totalPossible += target;
        totalCompleted += Math.min(completed, target);
      }
    } else {
      const { completed, target } = getHabitProgress(habit, completions, now);
      totalPossible += target;
      totalCompleted += Math.min(completed, target);
    }
  }

  return totalPossible > 0 ? totalCompleted / totalPossible : 0;
}

export function getCurrentStreak(
  habits: Habit[],
  completions: HabitCompletion[],
  now: Date = new Date()
): number {
  const dailyHabits = habits.filter((h) => h.isActive && h.frequencyType === 'daily');
  if (dailyHabits.length === 0) return 0;

  let streak = 0;
  let day = new Date(now);

  for (let i = 0; i < 365; i++) {
    const allDone = dailyHabits.every((habit) => {
      const { done } = getHabitProgress(habit, completions, day);
      return done;
    });
    if (allDone) {
      streak++;
      day.setDate(day.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function frequencyLabel(habit: Habit): string {
  const freq = habit.frequencyType;
  const count = habit.targetCount;
  const period = freq === 'daily' ? 'day' : freq === 'weekly' ? 'week' : 'month';
  return `${count}x per ${period}`;
}
