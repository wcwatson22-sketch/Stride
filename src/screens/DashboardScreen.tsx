import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useHabits } from '../store/HabitContext';
import { Habit } from '../models/types';
import {
  getTodayStats,
  getWeeklyConsistency,
  getCurrentStreak,
  getMotivationalLabel,
  getDueHabits,
  getHabitProgress,
  periodLabel,
  DueHabit,
} from '../utils/habitUtils';
import { getCategoryDef } from '../constants/categories';
import { Card } from '../components/Card';
import { HabitCard } from '../components/HabitCard';
import { Colors, Spacing, Typography, Radius } from '../theme';

const PINNED_PREVIEW_COUNT = 2;

export function DashboardScreen() {
  const navigation = useNavigation();
  const { state, updateSettings, logCompletion } = useHabits();
  const { habits, completions, settings } = state;

  const [pinnedExpanded, setPinnedExpanded] = useState(false);

  const activeHabits = habits.filter((h) => h.isActive);
  const dailyActiveHabits = activeHabits.filter((h) => h.frequencyType === 'daily');
  const hasHabits = habits.length > 0;

  // Pinned: active habits with isPinned true, sorted daily → weekly → monthly
  const pinnedHabits = activeHabits
    .filter((h) => h.isPinned)
    .sort((a, b) => {
      const order = { daily: 0, weekly: 1, monthly: 2 };
      return order[a.frequencyType] - order[b.frequencyType];
    });

  const visiblePinned = pinnedExpanded
    ? pinnedHabits
    : pinnedHabits.slice(0, PINNED_PREVIEW_COUNT);
  const hiddenPinnedCount = pinnedHabits.length - PINNED_PREVIEW_COUNT;

  const todayStats = getTodayStats(activeHabits, completions);
  const weeklyConsistency = getWeeklyConsistency(activeHabits, completions);
  const streak = getCurrentStreak(activeHabits, completions);
  const motivationalLabel = getMotivationalLabel(weeklyConsistency);
  const dueHabits = getDueHabits(activeHabits, completions);

  const remaining = todayStats.totalActions - todayStats.completedActions;
  const showDetails = settings.showIndividualHabitsOnDashboard;

  const greeting = getGreeting();

  function goToHabits() {
    navigation.navigate('Habits' as never);
  }

  // ── No habits yet ───────────────────────────────────────────────────────────
  if (!hasHabits) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.headerSection}>
          <Text style={styles.greeting}>{greeting}</Text>
        </View>
        <View style={styles.emptyStateWrap}>
          <View style={styles.emptyIconBox}>
            <Feather name="zap" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.emptyStateTitle}>Start building momentum.</Text>
          <Text style={styles.emptyStateBody}>
            Add your first habit to begin tracking your progress and consistency.
          </Text>
          <TouchableOpacity style={styles.emptyStateBtn} onPress={goToHabits} activeOpacity={0.8}>
            <Feather name="plus" size={16} color={Colors.surface} />
            <Text style={styles.emptyStateBtnText}>Add Habit</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Normal dashboard ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.subtitle}>Here's how you're doing</Text>
        </View>

        {/* ── Today's Progress ─────────────────────────────────────────────── */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: Colors.primaryLight }]}>
              <Feather name="sun" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Today's Progress</Text>
          </View>
          {todayStats.totalActions === 0 ? (
            <Text style={styles.emptyNote}>
              No daily habits active.{' '}
              <Text style={styles.linkText} onPress={goToHabits}>Add one →</Text>
            </Text>
          ) : (
            <>
              <View style={styles.bigStatRow}>
                <Text style={styles.bigStat}>{todayStats.completedActions}</Text>
                <Text style={styles.bigStatDivider}>/</Text>
                <Text style={styles.bigStatTotal}>{todayStats.totalActions}</Text>
                <Text style={styles.bigStatLabel}>actions today</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${todayStats.percentage * 100}%`,
                      backgroundColor:
                        todayStats.percentage >= 1 ? Colors.success : Colors.primary,
                    },
                  ]}
                />
              </View>
              {todayStats.percentage >= 1 ? (
                <Text style={[styles.progressNote, { color: Colors.success }]}>
                  All done for today! 🎉
                </Text>
              ) : (
                <Text style={styles.progressNote}>
                  {remaining} action{remaining !== 1 ? 's' : ''} remaining
                </Text>
              )}
            </>
          )}
        </Card>

        {/* ── Pinned Habits ────────────────────────────────────────────────── */}
        {pinnedHabits.length === 0 ? (
          <Card style={[styles.card, styles.pinnedEmptyCard]}>
            <View style={styles.pinnedEmptyRow}>
              <Feather name="bookmark" size={14} color={Colors.textMuted} />
              <Text style={styles.pinnedEmptyText}>
                No pinned habits.{' '}
                <Text style={styles.linkText} onPress={goToHabits}>Pin a habit →</Text>
              </Text>
            </View>
          </Card>
        ) : (
          <View>
            <View style={styles.sectionHeader}>
              <Feather name="bookmark" size={12} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Pinned</Text>
              <View style={styles.sectionPill}>
                <Text style={styles.sectionPillText}>{pinnedHabits.length}</Text>
              </View>
            </View>

            {visiblePinned.map((habit) => (
              <PinnedHabitCard
                key={habit.id}
                habit={habit}
                completions={completions}
                onComplete={() => logCompletion(habit.id)}
              />
            ))}

            {/* Expand / collapse control */}
            {pinnedHabits.length > PINNED_PREVIEW_COUNT && (
              <TouchableOpacity
                style={styles.expandBtn}
                onPress={() => setPinnedExpanded((v) => !v)}
                activeOpacity={0.7}
              >
                <Text style={styles.expandBtnText}>
                  {pinnedExpanded
                    ? 'Show Less'
                    : `Show ${hiddenPinnedCount} More`}
                </Text>
                <Feather
                  name={pinnedExpanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Weekly Consistency ───────────────────────────────────────────── */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: Colors.successLight }]}>
              <Feather name="bar-chart-2" size={16} color={Colors.success} />
            </View>
            <Text style={styles.cardTitle}>Weekly Consistency</Text>
          </View>
          <View style={styles.bigStatRow}>
            <Text style={[styles.bigStat, { color: Colors.success }]}>
              {Math.round(weeklyConsistency * 100)}%
            </Text>
            <Text style={styles.bigStatLabel}>this week</Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { width: `${weeklyConsistency * 100}%`, backgroundColor: Colors.success },
              ]}
            />
          </View>
          <View style={styles.motivationalRow}>
            <View
              style={[
                styles.motivationalBadge,
                { backgroundColor: motivationalColor(weeklyConsistency) + '22' },
              ]}
            >
              <Text
                style={[
                  styles.motivationalText,
                  { color: motivationalColor(weeklyConsistency) },
                ]}
              >
                {motivationalLabel}
              </Text>
            </View>
          </View>
        </Card>

        {/* ── Momentum ─────────────────────────────────────────────────────── */}
        {dailyActiveHabits.length > 0 && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: Colors.warningLight }]}>
                <Feather name="zap" size={16} color={Colors.warning} />
              </View>
              <Text style={styles.cardTitle}>Momentum</Text>
            </View>
            {streak === 0 ? (
              <>
                <View style={styles.bigStatRow}>
                  <Text style={[styles.bigStat, { color: Colors.textMuted }]}>0</Text>
                  <Text style={styles.bigStatLabel}>day streak</Text>
                </View>
                <Text style={styles.streakNote}>
                  Complete all daily habits to start your streak.
                </Text>
              </>
            ) : (
              <>
                <View style={styles.bigStatRow}>
                  <Text style={[styles.bigStat, { color: Colors.warning }]}>{streak}</Text>
                  <Text style={styles.bigStatLabel}>day streak</Text>
                </View>
                <Text style={styles.streakNote}>
                  {streak < 3
                    ? "Keep it going — you're just getting started!"
                    : streak < 7
                    ? 'Nice work — momentum is building!'
                    : "Incredible — don't break the chain!"}
                </Text>
              </>
            )}
          </Card>
        )}

        {/* ── Today's Actions ──────────────────────────────────────────────── */}
        <Card style={styles.card}>
          <View style={styles.actionsHeader}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: Colors.primaryLight }]}>
                <Feather name="check-circle" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.cardTitle}>Today's Actions</Text>
            </View>
            <Switch
              value={showDetails}
              onValueChange={(v) => updateSettings({ showIndividualHabitsOnDashboard: v })}
              trackColor={{ true: Colors.primary }}
              thumbColor={Colors.surface}
              style={styles.inlineSwitch}
            />
          </View>

          {!showDetails && (
            <ActionsAggregate
              todayStats={todayStats}
              remaining={remaining}
              onViewHabits={goToHabits}
            />
          )}
          {showDetails && (
            <ActionDetails
              dueHabits={dueHabits}
              onComplete={(id) => logCompletion(id)}
            />
          )}
        </Card>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Pinned Habit Card ──────────────────────────────────────────────────────────

interface PinnedHabitCardProps {
  habit: Habit;
  completions: ReturnType<typeof useHabits>['state']['completions'];
  onComplete: () => void;
}

function PinnedHabitCard({ habit, completions, onComplete }: PinnedHabitCardProps) {
  const { completed, target, percentage, done } = getHabitProgress(habit, completions);
  const period = periodLabel(habit);
  const catDef = habit.category ? getCategoryDef(habit.category) : null;

  return (
    <Card
      style={[
        pinnedStyles.card,
        catDef ? { borderLeftWidth: 3, borderLeftColor: catDef.color } : null,
      ]}
    >
      <View style={pinnedStyles.row}>
        {/* Left: name + meta */}
        <View style={pinnedStyles.info}>
          <View style={pinnedStyles.nameRow}>
            {catDef && <View style={[pinnedStyles.dot, { backgroundColor: catDef.color }]} />}
            <Text style={pinnedStyles.name} numberOfLines={1}>{habit.name}</Text>
          </View>
          <View style={pinnedStyles.metaRow}>
            {catDef && (
              <Text style={[pinnedStyles.catLabel, { color: catDef.color }]}>
                {habit.category}
              </Text>
            )}
            <Text style={pinnedStyles.progressText}>
              {completed}/{target} {period}
            </Text>
          </View>
          <View style={pinnedStyles.barTrack}>
            <View
              style={[
                pinnedStyles.barFill,
                {
                  width: `${percentage * 100}%`,
                  backgroundColor: done ? Colors.success : (catDef?.color ?? Colors.primary),
                },
              ]}
            />
          </View>
        </View>

        {/* Right: action */}
        {done ? (
          <View style={pinnedStyles.doneBox}>
            <Feather name="check-circle" size={20} color={Colors.success} />
          </View>
        ) : (
          <TouchableOpacity
            style={pinnedStyles.completeBtn}
            onPress={onComplete}
            activeOpacity={0.75}
          >
            <Feather name="plus" size={14} color={Colors.primary} />
            <Text style={pinnedStyles.completeBtnText}>Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

// ── Today's Actions sub-components ────────────────────────────────────────────

interface ActionsAggregateProps {
  todayStats: { completedActions: number; totalActions: number; percentage: number };
  remaining: number;
  onViewHabits: () => void;
}

function ActionsAggregate({ todayStats, remaining, onViewHabits }: ActionsAggregateProps) {
  if (todayStats.totalActions === 0) {
    return (
      <View style={aggStyles.wrap}>
        <Text style={aggStyles.emptyLine}>No daily habits active.</Text>
        <TouchableOpacity onPress={onViewHabits} activeOpacity={0.75} style={aggStyles.viewBtn}>
          <Text style={aggStyles.viewBtnText}>Manage Habits →</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (todayStats.percentage >= 1) {
    return (
      <View style={aggStyles.wrap}>
        <View style={aggStyles.caughtUpRow}>
          <Feather name="check-circle" size={16} color={Colors.success} />
          <Text style={aggStyles.caughtUpText}>All caught up for today!</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={aggStyles.wrap}>
      <View style={aggStyles.statRow}>
        <Text style={aggStyles.statMain}>
          {todayStats.completedActions} of {todayStats.totalActions} done today
        </Text>
        <Text style={aggStyles.statSub}>
          {remaining} action{remaining !== 1 ? 's' : ''} remaining
        </Text>
      </View>
      <TouchableOpacity onPress={onViewHabits} activeOpacity={0.75} style={aggStyles.viewBtn}>
        <Text style={aggStyles.viewBtnText}>View Habits →</Text>
      </TouchableOpacity>
    </View>
  );
}

interface ActionDetailsProps {
  dueHabits: DueHabit[];
  onComplete: (id: string) => void;
}

function ActionDetails({ dueHabits, onComplete }: ActionDetailsProps) {
  if (dueHabits.length === 0) {
    return (
      <View style={detailStyles.caughtUpRow}>
        <Feather name="check-circle" size={16} color={Colors.success} />
        <Text style={detailStyles.caughtUpText}>All caught up!</Text>
      </View>
    );
  }
  return (
    <View style={detailStyles.list}>
      {dueHabits.map((item) => (
        <DueHabitRow
          key={item.habit.id}
          item={item}
          onComplete={() => onComplete(item.habit.id)}
        />
      ))}
    </View>
  );
}

interface DueHabitRowProps {
  item: DueHabit;
  onComplete: () => void;
}

function DueHabitRow({ item, onComplete }: DueHabitRowProps) {
  const { habit, completed, target, period } = item;
  const pct = Math.min(1, completed / Math.max(1, target));
  const catDef = habit.category ? getCategoryDef(habit.category) : null;

  return (
    <View style={dueStyles.row}>
      <View style={dueStyles.info}>
        <View style={dueStyles.nameRow}>
          {catDef && <View style={[dueStyles.dot, { backgroundColor: catDef.color }]} />}
          <Text style={dueStyles.name} numberOfLines={1}>{habit.name}</Text>
        </View>
        <View style={dueStyles.barTrack}>
          <View
            style={[
              dueStyles.barFill,
              { width: `${pct * 100}%`, backgroundColor: catDef?.color ?? Colors.primary },
            ]}
          />
        </View>
        <Text style={dueStyles.progress}>
          {completed}/{target} {period}
        </Text>
      </View>
      <TouchableOpacity
        style={dueStyles.completeBtn}
        onPress={onComplete}
        activeOpacity={0.75}
      >
        <Feather name="plus" size={14} color={Colors.primary} />
        <Text style={dueStyles.completeBtnText}>Complete</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function motivationalColor(consistency: number): string {
  if (consistency >= 0.8) return Colors.success;
  if (consistency >= 0.5) return Colors.warning;
  if (consistency > 0) return '#EF4444';
  return Colors.textMuted;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const pinnedStyles = StyleSheet.create({
  card: { marginBottom: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  name: { ...Typography.body, fontWeight: '600' as const, flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  catLabel: { fontSize: 11, fontWeight: '600' as const },
  progressText: { ...Typography.bodySmall },
  barTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 2 },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
    flexShrink: 0,
  },
  completeBtnText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  doneBox: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

const aggStyles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  statRow: { gap: 2 },
  statMain: { ...Typography.body, fontWeight: '500' as const },
  statSub: { ...Typography.bodySmall },
  viewBtn: { alignSelf: 'flex-start' },
  viewBtnText: { ...Typography.bodySmall, color: Colors.primary, fontWeight: '600' as const },
  caughtUpRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  caughtUpText: { ...Typography.body, color: Colors.success, fontWeight: '500' as const },
  emptyLine: { ...Typography.bodySmall, fontStyle: 'italic' },
});

const detailStyles = StyleSheet.create({
  list: { gap: Spacing.sm, paddingTop: Spacing.xs },
  caughtUpRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: Spacing.xs },
  caughtUpText: { ...Typography.body, color: Colors.success, fontWeight: '500' as const },
});

const dueStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 3.5, flexShrink: 0 },
  name: { ...Typography.body, fontWeight: '500' as const, flexShrink: 1 },
  barTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 2 },
  progress: { ...Typography.bodySmall },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
    flexShrink: 0,
  },
  completeBtnText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Empty state
  emptyStateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emptyStateTitle: { ...Typography.h2, textAlign: 'center' },
  emptyStateBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyStateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    borderRadius: Radius.xl,
    marginTop: Spacing.xs,
  },
  emptyStateBtnText: { color: Colors.surface, fontWeight: '700' as const, fontSize: 15 },

  // Layout
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  headerSection: { paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  greeting: { ...Typography.h1 },
  subtitle: { ...Typography.bodySmall, marginTop: 2 },

  card: { marginBottom: Spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: 8 },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { ...Typography.h3, flex: 1 },

  bigStatRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  bigStat: { fontSize: 36, fontWeight: '700' as const, color: Colors.primary },
  bigStatDivider: { fontSize: 24, color: Colors.textSecondary, marginHorizontal: 2 },
  bigStatTotal: { fontSize: 24, fontWeight: '600' as const, color: Colors.textSecondary },
  bigStatLabel: { ...Typography.bodySmall, marginLeft: 4 },
  barTrack: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },
  progressNote: { ...Typography.bodySmall, marginTop: Spacing.xs },

  motivationalRow: { marginTop: Spacing.sm },
  motivationalBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.xl,
  },
  motivationalText: { fontSize: 12, fontWeight: '700' as const },
  streakNote: { ...Typography.bodySmall, marginTop: Spacing.xs },

  // Pinned section
  pinnedEmptyCard: { paddingVertical: Spacing.sm },
  pinnedEmptyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pinnedEmptyText: { ...Typography.bodySmall },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.label,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: Colors.primary,
  },
  sectionPill: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.xl,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  sectionPillText: { fontSize: 11, fontWeight: '700' as const, color: Colors.primary },

  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  expandBtnText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600' as const,
  },

  // Today's Actions
  actionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inlineSwitch: { marginLeft: Spacing.sm },

  emptyNote: { ...Typography.bodySmall, fontStyle: 'italic' },
  linkText: { color: Colors.primary, fontWeight: '600' as const, fontStyle: 'normal' },
});
