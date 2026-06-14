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

/** Exclusive upper bound for a habit's current period. */
export function getPeriodEnd(habit: Habit, now: Date = new Date()): Date {
  switch (habit.frequencyType) {
    case 'daily': {
      const d = getStartOfDay(now);
      d.setDate(d.getDate() + 1);
      return d;
    }
    case 'weekly': {
      const d = getStartOfWeek(now);
      d.setDate(d.getDate() + 7);
      return d;
    }
    case 'monthly': {
      const d = getStartOfMonth(now);
      d.setMonth(d.getMonth() + 1);
      return d;
    }
  }
}

/**
 * Count completions for a habit within a specific period only.
 * Uses both a start AND end boundary so past-period checks don't bleed
 * into completions that were recorded later.
 */
export function getCompletedCountForPeriod(
  habit: Habit,
  completions: HabitCompletion[],
  now: Date = new Date()
): number {
  const periodStart = getPeriodStart(habit, now);
  const periodEnd = getPeriodEnd(habit, now);
  return completions
    .filter(
      (c) =>
        c.habitId === habit.id &&
        new Date(c.completedAt) >= periodStart &&
        new Date(c.completedAt) < periodEnd
    )
    .reduce((sum, c) => sum + c.count, 0);
}

export function getHabitProgress(
  habit: Habit,
  completions: HabitCompletion[],
  now: Date = new Date()
): { completed: number; target: number; percentage: number; done: boolean } {
  const completed = getCompletedCountForPeriod(habit, completions, now);
  const target = Math.max(1, habit.targetCount); // defensive: never allow 0 target
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
      // Check each of the last 7 days with a proper per-day window
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

/**
 * Consecutive days where every active daily habit met its target.
 * A day only counts if there were actual completion records (completed > 0)
 * AND the target was met (completed >= target) AND the target is positive.
 */
export function getCurrentStreak(
  habits: Habit[],
  completions: HabitCompletion[],
  now: Date = new Date()
): number {
  const dailyHabits = habits.filter((h) => h.isActive && h.frequencyType === 'daily');
  if (dailyHabits.length === 0) return 0;
  if (completions.length === 0) return 0; // no completions = no streak

  let streak = 0;
  let day = new Date(now);

  for (let i = 0; i < 365; i++) {
    const allDone = dailyHabits.every((habit) => {
      const { completed, target } = getHabitProgress(habit, completions, day);
      // Requires actual completions, a positive target, and meeting the target.
      return target > 0 && completed > 0 && completed >= target;
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

/**
 * Best (longest) streak ever achieved for a single habit.
 * Walks from the earliest completion forward to today counting consecutive
 * completed periods; returns the longest run found.
 */
export function getBestStreak(
  habit: Habit,
  completions: HabitCompletion[],
  now: Date = new Date()
): number {
  const habitCompletions = completions.filter((c) => c.habitId === habit.id);
  if (habitCompletions.length === 0) return 0;

  const target = Math.max(1, habit.targetCount);
  const earliestMs = Math.min(
    ...habitCompletions.map((c) => new Date(c.completedAt).getTime())
  );
  const nowPeriodEnd = getPeriodEnd(habit, now);

  let best = 0;
  let run = 0;
  let cursor = getPeriodStart(habit, new Date(earliestMs));

  for (let i = 0; i < 3650 && cursor < nowPeriodEnd; i++) {
    const count = getCompletedCountForPeriod(habit, completions, cursor);
    if (count >= target) {
      run++;
      if (run > best) best = run;
    } else {
      run = 0;
    }
    cursor = getPeriodEnd(habit, cursor); // advance: periodEnd of current = start of next
  }

  return best;
}

export interface PeriodHistoryItem {
  label: string;
  status: 'complete' | 'missed' | 'current';
  completed: number;
  target: number;
}

/**
 * Recent period history for a habit, returned oldest-first.
 * Daily → last 7 days, Weekly → last 4 weeks, Monthly → last 6 months.
 */
export function getRecentHistory(
  habit: Habit,
  completions: HabitCompletion[],
  now: Date = new Date()
): PeriodHistoryItem[] {
  const target = Math.max(1, habit.targetCount);
  const periodCount =
    habit.frequencyType === 'daily' ? 7 : habit.frequencyType === 'weekly' ? 4 : 6;
  const currentPeriodStart = getPeriodStart(habit, now).getTime();

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const items: PeriodHistoryItem[] = [];
  let cursor = new Date(now);

  for (let i = 0; i < periodCount; i++) {
    const periodStart = getPeriodStart(habit, cursor);
    const isCurrent = periodStart.getTime() === currentPeriodStart;
    const count = getCompletedCountForPeriod(habit, completions, cursor);

    const status: PeriodHistoryItem['status'] =
      count >= target ? 'complete' : isCurrent ? 'current' : 'missed';

    let label: string;
    if (habit.frequencyType === 'daily') {
      label = DAYS[periodStart.getDay()];
    } else if (habit.frequencyType === 'weekly') {
      label = i === 0 ? 'This wk' : i === 1 ? 'Last wk' : `${i}w ago`;
    } else {
      label = MONTHS[periodStart.getMonth()];
    }

    items.push({ label, status, completed: count, target });
    cursor = getPreviousPeriodDate(habit, cursor);
  }

  return items.reverse(); // oldest first
}

/** Overall progress across all active habits in their current period. */
export function getOverallProgress(
  habits: Habit[],
  completions: HabitCompletion[],
  now: Date = new Date()
): { completed: number; total: number; percentage: number } {
  const total = habits.length;
  if (total === 0) return { completed: 0, total: 0, percentage: 0 };
  const completed = habits.filter(
    (h) => getHabitProgress(h, completions, now).done
  ).length;
  return { completed, total, percentage: completed / total };
}

export interface CategoryProgress {
  category: string;
  completed: number;
  target: number;
}

/**
 * Per-category aggregation of current-period progress across all active habits.
 * Habits with no category are grouped under "Other".
 */
export function getCategorySnapshot(
  habits: Habit[],
  completions: HabitCompletion[],
  now: Date = new Date()
): CategoryProgress[] {
  const map = new Map<string, { completed: number; target: number }>();
  for (const habit of habits) {
    const cat = habit.category || 'Other';
    const { completed, target } = getHabitProgress(habit, completions, now);
    const prev = map.get(cat) ?? { completed: 0, target: 0 };
    map.set(cat, {
      completed: prev.completed + Math.min(completed, target),
      target: prev.target + target,
    });
  }
  return Array.from(map.entries())
    .map(([category, stats]) => ({ category, ...stats }))
    .sort((a, b) => b.target - a.target);
}

/** Motivational label based on weekly consistency (0–1). */
export function getMotivationalLabel(consistency: number): string {
  if (consistency >= 0.8) return 'Strong Week';
  if (consistency >= 0.5) return 'Building Momentum';
  if (consistency > 0)   return 'Needs Attention';
  return 'Start Today';
}

/**
 * Returns a date that falls inside the period immediately before the one
 * that contains `date`. Used to walk backwards through consecutive periods.
 */
function getPreviousPeriodDate(habit: Habit, date: Date): Date {
  // Step back 1 ms from the start of the current period → lands in previous period
  return new Date(getPeriodStart(habit, date).getTime() - 1);
}

/**
 * Current streak for a single habit.
 *
 * Rules:
 * - If the current period is complete (completed >= target), it counts and we
 *   walk backwards through prior periods.
 * - If the current period is incomplete, we skip it and start the count from
 *   the previous period (so an in-progress day/week/month never breaks an
 *   existing streak).
 * - A period only counts if completed >= target AND target > 0.
 * - Zero completions for this habit → streak is 0.
 */
export function getIndividualStreak(
  habit: Habit,
  completions: HabitCompletion[],
  now: Date = new Date()
): number {
  const target = Math.max(1, habit.targetCount);

  // Fast exit: no completions at all for this habit
  if (!completions.some((c) => c.habitId === habit.id)) return 0;

  // Decide whether to start counting from the current period or the previous one
  const currentCount = getCompletedCountForPeriod(habit, completions, now);
  const currentDone = currentCount >= target;

  // checkDate is a date that falls inside the period we're evaluating
  let checkDate = currentDone ? now : getPreviousPeriodDate(habit, now);
  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const count = getCompletedCountForPeriod(habit, completions, checkDate);
    if (count >= target) {
      streak++;
      checkDate = getPreviousPeriodDate(habit, checkDate);
    } else {
      break;
    }
  }

  return streak;
}

/** Human-readable period label for a habit's frequency. */
export function periodLabel(habit: Habit): string {
  switch (habit.frequencyType) {
    case 'daily':   return 'today';
    case 'weekly':  return 'this week';
    case 'monthly': return 'this month';
  }
}

/** Human-readable frequency summary for a habit. */
export function frequencyLabel(habit: Habit): string {
  const freq = habit.frequencyType;
  const count = habit.targetCount;
  const period = freq === 'daily' ? 'day' : freq === 'weekly' ? 'week' : 'month';
  return `${count}x per ${period}`;
}

/** Active habits that haven't yet met their current-period target. */
export interface DueHabit {
  habit: Habit;
  completed: number;
  target: number;
  period: string;
}

export function getDueHabits(
  habits: Habit[],
  completions: HabitCompletion[],
  now: Date = new Date()
): DueHabit[] {
  return habits
    .filter((h) => h.isActive)
    .map((habit) => {
      const { completed, target } = getHabitProgress(habit, completions, now);
      return { habit, completed, target, period: periodLabel(habit) };
    })
    .filter(({ completed, target }) => completed < target);
}
