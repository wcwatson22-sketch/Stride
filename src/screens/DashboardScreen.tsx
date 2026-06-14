import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useHabits } from '../store/HabitContext';
import { Habit, HabitCompletion } from '../models/types';
import {
  getDueHabits,
  getHabitProgress,
  getIndividualStreak,
  getOverallProgress,
  getWeeklyConsistency,
  getCurrentStreak,
  getMotivationalLabel,
  getCategorySnapshot,
  periodLabel,
  DueHabit,
} from '../utils/habitUtils';
import { getCategoryDef } from '../constants/categories';
import { Card } from '../components/Card';
import { StreakBadge } from '../components/StreakBadge';
import { Colors, Spacing, Typography, Radius } from '../theme';

const ACTIONS_PREVIEW = 4;

// ── Main screen ────────────────────────────────────────────────────────────────

export function DashboardScreen() {
  const navigation = useNavigation();
  const { state, logCompletion } = useHabits();
  const { habits, completions } = state;

  const [actionsExpanded, setActionsExpanded] = useState(false);
  const [completedExpanded, setCompletedExpanded] = useState(false);

  const activeHabits = habits.filter((h) => h.isActive);
  const hasHabits = habits.length > 0;

  const dueItems = getDueHabits(activeHabits, completions);
  const doneHabits = activeHabits.filter(
    (h) => getHabitProgress(h, completions).done
  );

  const visibleDue = actionsExpanded
    ? dueItems
    : dueItems.slice(0, ACTIONS_PREVIEW);
  const hiddenCount = dueItems.length - ACTIONS_PREVIEW;

  const overall = getOverallProgress(activeHabits, completions);
  const weeklyConsistency = getWeeklyConsistency(activeHabits, completions);
  const streak = getCurrentStreak(activeHabits, completions);
  const motivationalLabel = getMotivationalLabel(weeklyConsistency);
  const categorySnapshot = getCategorySnapshot(activeHabits, completions);

  function goToHabits() {
    navigation.navigate('Habits' as never);
  }

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!hasHabits) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <Text style={s.greeting}>{greeting()}</Text>
        </View>
        <View style={s.emptyWrap}>
          <View style={s.emptyIcon}>
            <Feather name="zap" size={30} color={Colors.primary} />
          </View>
          <Text style={s.emptyTitle}>Start building momentum.</Text>
          <Text style={s.emptyBody}>
            Add your first habit to begin tracking your progress.
          </Text>
          <TouchableOpacity style={s.emptyBtn} onPress={goToHabits} activeOpacity={0.8}>
            <Feather name="plus" size={15} color={Colors.surface} />
            <Text style={s.emptyBtnText}>Add Habit</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.greeting}>{greeting()}</Text>
          <Text style={s.subGreeting}>
            {dueItems.length === 0
              ? "You're all caught up."
              : `${dueItems.length} action${dueItems.length !== 1 ? 's' : ''} remaining`}
          </Text>
        </View>

        {/* ── A. TODAY'S ACTIONS ──────────────────────────────────────────────── */}
        <View style={s.sectionHeader}>
          <Feather name="check-circle" size={13} color={Colors.primary} />
          <Text style={s.sectionTitle}>TODAY'S ACTIONS</Text>
        </View>

        <Card style={s.actionsCard}>
          {dueItems.length === 0 && doneHabits.length === 0 ? (
            // No active habits at all
            <View style={s.caughtUp}>
              <Text style={s.caughtUpText}>No active habits yet. </Text>
              <TouchableOpacity onPress={goToHabits} activeOpacity={0.75}>
                <Text style={s.linkText}>Add one →</Text>
              </TouchableOpacity>
            </View>
          ) : dueItems.length === 0 ? (
            // All done
            <View style={s.caughtUp}>
              <Feather name="check-circle" size={16} color={Colors.success} />
              <Text style={[s.caughtUpText, { color: Colors.success }]}>
                You're caught up for now.
              </Text>
            </View>
          ) : (
            <>
              {visibleDue.map((item, idx) => (
                <ActionRow
                  key={item.habit.id}
                  item={item}
                  completions={completions}
                  isFirst={idx === 0}
                  onComplete={() => logCompletion(item.habit.id)}
                />
              ))}

              {/* Show More / Show Less */}
              {hiddenCount > 0 && !actionsExpanded && (
                <TouchableOpacity
                  style={s.showMoreRow}
                  onPress={() => setActionsExpanded(true)}
                  activeOpacity={0.7}
                >
                  <Text style={s.showMoreText}>
                    Show {hiddenCount} more
                  </Text>
                  <Feather name="chevron-down" size={14} color={Colors.primary} />
                </TouchableOpacity>
              )}
              {actionsExpanded && dueItems.length > ACTIONS_PREVIEW && (
                <TouchableOpacity
                  style={s.showMoreRow}
                  onPress={() => setActionsExpanded(false)}
                  activeOpacity={0.7}
                >
                  <Text style={s.showMoreText}>Show less</Text>
                  <Feather name="chevron-up" size={14} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Completed section */}
          {doneHabits.length > 0 && (
            <>
              <TouchableOpacity
                style={s.completedToggle}
                onPress={() => setCompletedExpanded((v) => !v)}
                activeOpacity={0.7}
              >
                <Feather name="check" size={12} color={Colors.success} />
                <Text style={s.completedToggleText}>
                  {doneHabits.length} completed
                </Text>
                <Feather
                  name={completedExpanded ? 'chevron-up' : 'chevron-down'}
                  size={12}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>

              {completedExpanded &&
                doneHabits.map((habit) => (
                  <CompletedRow key={habit.id} habit={habit} completions={completions} />
                ))}
            </>
          )}
        </Card>

        {/* ── B. TODAY'S OVERVIEW ─────────────────────────────────────────────── */}
        {activeHabits.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <Feather name="sun" size={13} color={Colors.textMuted} />
              <Text style={s.sectionTitle}>TODAY'S OVERVIEW</Text>
            </View>
            <Card style={s.overviewCard}>
              <View style={s.overviewRow}>
                <View style={s.overviewStat}>
                  <Text style={s.overviewNum}>{overall.completed}</Text>
                  <Text style={s.overviewLabel}>done</Text>
                </View>
                <View style={s.overviewDivider} />
                <View style={s.overviewStat}>
                  <Text style={s.overviewNum}>{overall.total - overall.completed}</Text>
                  <Text style={s.overviewLabel}>remaining</Text>
                </View>
                <View style={s.overviewDivider} />
                <View style={s.overviewStat}>
                  <Text style={[s.overviewNum, { color: overall.percentage >= 1 ? Colors.success : Colors.primary }]}>
                    {Math.round(overall.percentage * 100)}%
                  </Text>
                  <Text style={s.overviewLabel}>complete</Text>
                </View>
              </View>
              <View style={s.overviewBar}>
                <View
                  style={[
                    s.overviewBarFill,
                    {
                      width: `${overall.percentage * 100}%`,
                      backgroundColor:
                        overall.percentage >= 1 ? Colors.success : Colors.primary,
                    },
                  ]}
                />
              </View>
            </Card>
          </>
        )}

        {/* ── C. WEEKLY MOMENTUM ──────────────────────────────────────────────── */}
        {activeHabits.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <Feather name="zap" size={13} color={Colors.textMuted} />
              <Text style={s.sectionTitle}>WEEKLY MOMENTUM</Text>
            </View>
            <Card style={s.weekCard}>
              <View style={s.weekRow}>
                <View style={s.weekStat}>
                  <Text style={[s.weekNum, { color: Colors.success }]}>
                    {Math.round(weeklyConsistency * 100)}%
                  </Text>
                  <Text style={s.weekLabel}>consistency</Text>
                </View>
                <View style={s.overviewDivider} />
                <View style={s.weekStat}>
                  <Text style={[s.weekNum, { color: Colors.warning }]}>{streak}</Text>
                  <Text style={s.weekLabel}>day streak</Text>
                </View>
                <View style={s.overviewDivider} />
                <View style={[s.weekStat, { flex: 2 }]}>
                  <Text
                    style={[
                      s.motivLabel,
                      { color: motivationalColor(weeklyConsistency) },
                    ]}
                  >
                    {motivationalLabel}
                  </Text>
                </View>
              </View>
            </Card>
          </>
        )}

        {/* ── D. CATEGORY SNAPSHOT ────────────────────────────────────────────── */}
        {categorySnapshot.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <Feather name="grid" size={13} color={Colors.textMuted} />
              <Text style={s.sectionTitle}>BY CATEGORY</Text>
            </View>
            <Card style={s.catCard}>
              {categorySnapshot.map((item, idx) => {
                const catDef = getCategoryDef(item.category);
                const pct = item.target > 0 ? item.completed / item.target : 0;
                return (
                  <View
                    key={item.category}
                    style={[
                      s.catRow,
                      idx > 0 && s.catRowBorder,
                    ]}
                  >
                    <View style={[s.catDot, { backgroundColor: catDef.color }]} />
                    <Text style={s.catName}>{item.category}</Text>
                    <View style={s.catBarWrap}>
                      <View style={s.catBar}>
                        <View
                          style={[
                            s.catBarFill,
                            {
                              width: `${pct * 100}%`,
                              backgroundColor:
                                pct >= 1 ? Colors.success : catDef.color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={s.catProgress}>
                      {item.completed}/{item.target}
                    </Text>
                  </View>
                );
              })}
            </Card>
          </>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Action Row (due habit) ─────────────────────────────────────────────────────

interface ActionRowProps {
  item: DueHabit;
  completions: HabitCompletion[];
  isFirst: boolean;
  onComplete: () => void;
}

function ActionRow({ item, completions, isFirst, onComplete }: ActionRowProps) {
  const { habit, completed, target, period } = item;
  const catDef = habit.category ? getCategoryDef(habit.category) : null;
  const streak = getIndividualStreak(habit, completions);

  return (
    <View style={[row.container, !isFirst && row.border]}>
      {/* Category color stripe */}
      <View
        style={[row.stripe, { backgroundColor: catDef?.color ?? Colors.border }]}
      />

      {/* Content */}
      <View style={row.body}>
        <View style={row.topLine}>
          <Text style={row.name} numberOfLines={1}>
            {habit.name}
          </Text>
          <StreakBadge streak={streak} habit={habit} />
        </View>
        <Text style={row.meta} numberOfLines={1}>
          {habit.category ? `${habit.category} · ` : ''}
          {completed}/{target} {period}
        </Text>
      </View>

      {/* Action */}
      <TouchableOpacity
        style={row.btn}
        onPress={onComplete}
        activeOpacity={0.75}
        hitSlop={6}
      >
        <Feather name="plus" size={13} color={Colors.primary} />
        <Text style={row.btnText}>Complete</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Completed Row ──────────────────────────────────────────────────────────────

interface CompletedRowProps {
  habit: Habit;
  completions: HabitCompletion[];
}

function CompletedRow({ habit, completions }: CompletedRowProps) {
  const { completed, target } = getHabitProgress(habit, completions);
  const period = periodLabel(habit);
  const catDef = habit.category ? getCategoryDef(habit.category) : null;

  return (
    <View style={[doneRow.container, doneRow.border]}>
      <View style={[doneRow.stripe, { backgroundColor: catDef?.color ?? Colors.border }]} />
      <View style={doneRow.body}>
        <Text style={doneRow.name} numberOfLines={1}>
          {habit.name}
        </Text>
        <Text style={doneRow.meta}>
          {completed}/{target} {period}
        </Text>
      </View>
      <View style={doneRow.doneChip}>
        <Feather name="check" size={11} color={Colors.success} />
        <Text style={doneRow.doneText}>Done</Text>
      </View>
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

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },

  header: { paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  greeting: { ...Typography.h1 },
  subGreeting: { ...Typography.bodySmall, marginTop: 3 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: Spacing.md,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    color: Colors.textMuted,
  },

  // Actions card
  actionsCard: { padding: 0, overflow: 'hidden' },

  caughtUp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: Spacing.md,
  },
  caughtUpText: { ...Typography.body },
  linkText: { ...Typography.body, color: Colors.primary, fontWeight: '600' as const },

  showMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  showMoreText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600' as const,
  },

  completedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  completedToggleText: {
    ...Typography.bodySmall,
    color: Colors.success,
    fontWeight: '600' as const,
    flex: 1,
  },

  // Overview card
  overviewCard: { paddingVertical: Spacing.sm },
  overviewRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  overviewStat: { flex: 1, alignItems: 'center' },
  overviewNum: { fontSize: 22, fontWeight: '700' as const, color: Colors.primary },
  overviewLabel: { ...Typography.bodySmall, marginTop: 2 },
  overviewDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  overviewBar: {
    height: 5,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  overviewBarFill: { height: '100%', borderRadius: 3 },

  // Weekly card
  weekCard: { paddingVertical: Spacing.sm },
  weekRow: { flexDirection: 'row', alignItems: 'center' },
  weekStat: { flex: 1, alignItems: 'center' },
  weekNum: { fontSize: 22, fontWeight: '700' as const },
  weekLabel: { ...Typography.bodySmall, marginTop: 2 },
  motivLabel: { fontSize: 12, fontWeight: '700' as const, textAlign: 'center' },

  // Category card
  catCard: { padding: 0, overflow: 'hidden' },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: 8,
  },
  catRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  catDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  catName: { ...Typography.bodySmall, fontWeight: '600' as const, width: 72 },
  catBarWrap: { flex: 1 },
  catBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  catBarFill: { height: '100%', borderRadius: 2 },
  catProgress: { ...Typography.bodySmall, minWidth: 34, textAlign: 'right' },

  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 60,
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { ...Typography.h2, textAlign: 'center' },
  emptyBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    borderRadius: Radius.xl,
    marginTop: 4,
  },
  emptyBtnText: { color: Colors.surface, fontWeight: '700' as const, fontSize: 15 },
});

const row = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.sm,
    minHeight: 58,
  },
  border: { borderTopWidth: 1, borderTopColor: Colors.border },
  stripe: { width: 3, alignSelf: 'stretch' },
  body: { flex: 1, paddingVertical: 10, paddingHorizontal: Spacing.sm, gap: 3 },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { ...Typography.body, fontWeight: '600' as const, flex: 1 },
  meta: { ...Typography.bodySmall },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    flexShrink: 0,
  },
  btnText: { ...Typography.bodySmall, color: Colors.primary, fontWeight: '600' as const },
});

const doneRow = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.sm,
    minHeight: 50,
    opacity: 0.6,
  },
  border: { borderTopWidth: 1, borderTopColor: Colors.border },
  stripe: { width: 3, alignSelf: 'stretch' },
  body: { flex: 1, paddingVertical: 8, paddingHorizontal: Spacing.sm, gap: 2 },
  name: { ...Typography.body, fontWeight: '500' as const },
  meta: { ...Typography.bodySmall },
  doneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  doneText: { ...Typography.bodySmall, color: Colors.success, fontWeight: '600' as const },
});
