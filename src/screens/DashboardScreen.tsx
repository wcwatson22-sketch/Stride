import React from 'react';
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
import {
  getTodayStats,
  getWeeklyConsistency,
  getCurrentStreak,
  getMotivationalLabel,
  getDueHabits,
  DueHabit,
} from '../utils/habitUtils';
import { Card } from '../components/Card';
import { HabitCard } from '../components/HabitCard';
import { Colors, Spacing, Typography, Radius } from '../theme';

export function DashboardScreen() {
  const navigation = useNavigation();
  const { state, updateSettings, logCompletion } = useHabits();
  const { habits, completions, settings } = state;

  const activeHabits = habits.filter((h) => h.isActive);
  const dailyActiveHabits = activeHabits.filter((h) => h.frequencyType === 'daily');
  const hasHabits = habits.length > 0;

  const todayStats = getTodayStats(activeHabits, completions);
  const weeklyConsistency = getWeeklyConsistency(activeHabits, completions);
  const streak = getCurrentStreak(activeHabits, completions);
  const motivationalLabel = getMotivationalLabel(weeklyConsistency);
  const dueHabits = getDueHabits(activeHabits, completions);

  const remaining = todayStats.totalActions - todayStats.completedActions;
  const showDetails = settings.showIndividualHabitsOnDashboard;
  const dashboardHabits = activeHabits.filter((h) => h.showOnDashboard);

  const greeting = getGreeting();

  function goToHabits() {
    navigation.navigate('Habits' as never);
  }

  // ── No habits yet: full empty state ────────────────────────────────────────
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

        {/* Today's Progress — aggregate bar, always visible */}
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

        {/* Weekly Consistency — always visible */}
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

        {/* Momentum — only shown when daily habits exist (streak is meaningful) */}
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
                  <Text style={styles.bigStatLabel}>
                    {streak === 1 ? 'day streak' : 'day streak'}
                  </Text>
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

        {/* ── Today's Actions card ──────────────────────────────────────────── */}
        {/* Always visible. Shows aggregate when details are hidden, individual rows when on. */}
        <Card style={styles.card}>
          <View style={styles.actionsHeader}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: Colors.primaryLight }]}>
                <Feather name="check-circle" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.cardTitle}>Today's Actions</Text>
            </View>
            {/* Inline toggle */}
            <Switch
              value={showDetails}
              onValueChange={(v) => updateSettings({ showIndividualHabitsOnDashboard: v })}
              trackColor={{ true: Colors.primary }}
              thumbColor={Colors.surface}
              style={styles.inlineSwitch}
            />
          </View>

          {/* Toggle OFF — aggregate only, no habit names */}
          {!showDetails && (
            <ActionsAggregate
              todayStats={todayStats}
              dueCount={dueHabits.length}
              remaining={remaining}
              onViewHabits={goToHabits}
            />
          )}

          {/* Toggle ON — individual due habit rows */}
          {showDetails && (
            <ActionDetails
              dueHabits={dueHabits}
              onComplete={(id) => logCompletion(id)}
            />
          )}
        </Card>

        {/* Individual habit progress cards — only when details are on and habits opted in */}
        {showDetails && dashboardHabits.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Individual Progress</Text>
            </View>
            {dashboardHabits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} onEdit={() => {}} compact />
            ))}
          </View>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface ActionsAggregateProps {
  todayStats: { completedActions: number; totalActions: number; percentage: number };
  dueCount: number;
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
  return (
    <View style={dueStyles.row}>
      <View style={dueStyles.info}>
        <Text style={dueStyles.name} numberOfLines={1}>{habit.name}</Text>
        <View style={dueStyles.barTrack}>
          <View style={[dueStyles.barFill, { width: `${pct * 100}%` }]} />
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
  name: { ...Typography.body, fontWeight: '500' as const },
  barTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
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
  emptyStateTitle: {
    ...Typography.h2,
    textAlign: 'center',
  },
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
  emptyStateBtnText: {
    color: Colors.surface,
    fontWeight: '700' as const,
    fontSize: 15,
  },

  // Normal layout
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
  progressNote: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
  },
  motivationalRow: { marginTop: Spacing.sm },
  motivationalBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.xl,
  },
  motivationalText: { fontSize: 12, fontWeight: '700' as const },
  streakNote: { ...Typography.bodySmall, marginTop: Spacing.xs },

  // Today's Actions card header (title + inline switch)
  actionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inlineSwitch: { marginLeft: Spacing.sm },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.label,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: Colors.textSecondary,
  },
  emptyNote: { ...Typography.bodySmall, fontStyle: 'italic' },
  linkText: { color: Colors.primary, fontWeight: '600' as const, fontStyle: 'normal' },
});
