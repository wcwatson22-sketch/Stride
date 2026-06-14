import React, { useRef, useState } from 'react';
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
  getCompletedCountForPeriod,
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
import { HabitFormModal } from '../components/HabitFormModal';
import { Colors, Spacing, Typography, Radius } from '../theme';

const ACTIONS_PREVIEW = 4;
const UNDO_DURATION_MS = 4000;

interface UndoState {
  completionId: string;
  habitName: string;
}

// ── Main screen ────────────────────────────────────────────────────────────────

export function DashboardScreen() {
  const navigation = useNavigation();
  const { state, logCompletion, removeCompletion } = useHabits();
  const { habits, completions } = state;

  const [actionsExpanded, setActionsExpanded] = useState(false);
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  // Only show categories that have meaningful targets (exclude uncategorized 0/0)
  const categorySnapshot = getCategorySnapshot(activeHabits, completions).filter(
    (c) => c.target > 0
  );

  // ── Complete with guard + undo ─────────────────────────────────────────────
  function handleComplete(habit: Habit) {
    // Guard: prevent over-completion
    const current = getCompletedCountForPeriod(habit, completions);
    if (current >= habit.targetCount) return;

    const completionId = logCompletion(habit.id);

    // Clear any existing undo timer and start a fresh one
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoState({ completionId, habitName: habit.name });
    undoTimer.current = setTimeout(() => {
      setUndoState(null);
      undoTimer.current = null;
    }, UNDO_DURATION_MS);
  }

  function handleUndo() {
    if (!undoState) return;
    if (undoTimer.current) {
      clearTimeout(undoTimer.current);
      undoTimer.current = null;
    }
    removeCompletion(undoState.completionId);
    setUndoState(null);
  }

  function goToHabits() {
    navigation.navigate('Habits' as never);
  }

  // ── Empty state (no habits at all) ──────────────────────────────────────────
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
          <TouchableOpacity
            style={s.emptyBtn}
            onPress={() => setAddModalVisible(true)}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={15} color={Colors.surface} />
            <Text style={s.emptyBtnText}>Add Habit</Text>
          </TouchableOpacity>
        </View>
        <HabitFormModal
          visible={addModalVisible}
          onClose={() => setAddModalVisible(false)}
        />
      </SafeAreaView>
    );
  }

  // ── Main dashboard ───────────────────────────────────────────────────────────
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
        <SectionHeader icon="check-circle" title="TODAY'S ACTIONS" />
        <Card style={s.actionsCard}>
          {dueItems.length === 0 && doneHabits.length === 0 ? (
            // Active habits exist but none are due (all paused or odd state)
            <View style={s.caughtUpRow}>
              <Text style={s.caughtUpText}>No actions due right now.</Text>
            </View>
          ) : dueItems.length === 0 ? (
            // All habits complete for their current period
            <View style={s.caughtUpRow}>
              <Feather name="check-circle" size={15} color={Colors.success} />
              <Text style={[s.caughtUpText, { color: Colors.success }]}>
                All actions are complete for now.
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
                  onComplete={() => handleComplete(item.habit)}
                />
              ))}

              {hiddenCount > 0 && !actionsExpanded && (
                <TouchableOpacity
                  style={s.expandRow}
                  onPress={() => setActionsExpanded(true)}
                  activeOpacity={0.7}
                >
                  <Text style={s.expandText}>Show {hiddenCount} more</Text>
                  <Feather name="chevron-down" size={14} color={Colors.primary} />
                </TouchableOpacity>
              )}
              {actionsExpanded && dueItems.length > ACTIONS_PREVIEW && (
                <TouchableOpacity
                  style={s.expandRow}
                  onPress={() => setActionsExpanded(false)}
                  activeOpacity={0.7}
                >
                  <Text style={s.expandText}>Show less</Text>
                  <Feather name="chevron-up" size={14} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Completed disclosure */}
          {doneHabits.length > 0 && (
            <>
              <TouchableOpacity
                style={[s.completedToggle, dueItems.length > 0 && s.completedToggleBorder]}
                onPress={() => setCompletedExpanded((v) => !v)}
                activeOpacity={0.7}
              >
                <Feather name="check" size={12} color={Colors.success} />
                <Text style={s.completedToggleText}>{doneHabits.length} completed</Text>
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
        <SectionHeader icon="sun" title="TODAY'S OVERVIEW" muted />
        <Card style={s.overviewCard}>
          <View style={s.overviewRow}>
            <OverviewStat value={overall.completed} label="done" color={Colors.primary} />
            <View style={s.divider} />
            <OverviewStat value={overall.total - overall.completed} label="remaining" />
            <View style={s.divider} />
            <OverviewStat
              value={`${Math.round(overall.percentage * 100)}%`}
              label="complete"
              color={overall.percentage >= 1 ? Colors.success : Colors.primary}
            />
          </View>
          <View style={s.overviewBar}>
            <View
              style={[
                s.overviewBarFill,
                {
                  width: `${overall.percentage * 100}%`,
                  backgroundColor: overall.percentage >= 1 ? Colors.success : Colors.primary,
                },
              ]}
            />
          </View>
        </Card>

        {/* ── C. WEEKLY MOMENTUM ──────────────────────────────────────────────── */}
        <SectionHeader icon="zap" title="WEEKLY MOMENTUM" muted />
        <Card style={s.weekCard}>
          <View style={s.weekRow}>
            <View style={s.weekStat}>
              <Text style={[s.weekNum, { color: Colors.success }]}>
                {Math.round(weeklyConsistency * 100)}%
              </Text>
              <Text style={s.weekLabel}>consistency</Text>
            </View>
            <View style={s.divider} />
            <View style={s.weekStat}>
              <Text style={[s.weekNum, { color: Colors.warning }]}>{streak}</Text>
              <Text style={s.weekLabel}>day streak</Text>
            </View>
            <View style={s.divider} />
            <View style={[s.weekStat, { flex: 2 }]}>
              <Text style={[s.motivLabel, { color: motivationalColor(weeklyConsistency) }]}>
                {motivationalLabel}
              </Text>
            </View>
          </View>
        </Card>

        {/* ── D. BY CATEGORY ──────────────────────────────────────────────────── */}
        {categorySnapshot.length > 0 && (
          <>
            <SectionHeader icon="grid" title="BY CATEGORY" muted />
            <Card style={s.catCard}>
              {categorySnapshot.map((item, idx) => {
                const catDef = getCategoryDef(item.category);
                const pct = item.completed / item.target;
                return (
                  <View key={item.category} style={[s.catRow, idx > 0 && s.catRowBorder]}>
                    <View style={[s.catDot, { backgroundColor: catDef.color }]} />
                    <Text style={s.catName} numberOfLines={1}>{item.category}</Text>
                    <View style={s.catBarWrap}>
                      <View style={s.catBar}>
                        <View
                          style={[
                            s.catBarFill,
                            {
                              width: `${pct * 100}%`,
                              backgroundColor: pct >= 1 ? Colors.success : catDef.color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={s.catProgress}>{item.completed}/{item.target}</Text>
                  </View>
                );
              })}
            </Card>
          </>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Undo snackbar — sits above bottom edge, outside the scroll */}
      {undoState && (
        <View style={s.snackbar} pointerEvents="box-none">
          <View style={s.snackbarInner}>
            <Feather name="check-circle" size={14} color={Colors.surface} />
            <Text style={s.snackbarText} numberOfLines={1}>
              {undoState.habitName} logged
            </Text>
            <TouchableOpacity onPress={handleUndo} hitSlop={8} activeOpacity={0.8}>
              <Text style={s.snackbarUndo}>Undo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  muted = false,
}: {
  icon: string;
  title: string;
  muted?: boolean;
}) {
  return (
    <View style={s.sectionHeader}>
      <Feather
        name={icon as any}
        size={12}
        color={muted ? Colors.textMuted : Colors.primary}
      />
      <Text style={[s.sectionTitle, muted && s.sectionTitleMuted]}>{title}</Text>
    </View>
  );
}

function OverviewStat({
  value,
  label,
  color,
}: {
  value: number | string;
  label: string;
  color?: string;
}) {
  return (
    <View style={s.overviewStat}>
      <Text style={[s.overviewNum, color ? { color } : null]}>{value}</Text>
      <Text style={s.overviewLabel}>{label}</Text>
    </View>
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
      <View style={[row.stripe, { backgroundColor: catDef?.color ?? Colors.border }]} />
      <View style={row.body}>
        {/* Top line: name (flex) + streak (fixed right) */}
        <View style={row.topLine}>
          <Text style={row.name} numberOfLines={1}>{habit.name}</Text>
          <StreakBadge streak={streak} habit={habit} />
        </View>
        {/* Bottom line: meta (flex) + complete button (fixed right) */}
        <View style={row.bottomLine}>
          <Text style={row.meta} numberOfLines={1}>
            {habit.category ? `${habit.category} · ` : ''}
            {completed}/{target} {period}
          </Text>
          <TouchableOpacity
            style={row.btn}
            onPress={onComplete}
            activeOpacity={0.75}
            hitSlop={6}
          >
            <Feather name="plus" size={12} color={Colors.primary} />
            <Text style={row.btnText}>Complete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Completed Row ──────────────────────────────────────────────────────────────

function CompletedRow({ habit, completions }: { habit: Habit; completions: HabitCompletion[] }) {
  const { completed, target } = getHabitProgress(habit, completions);
  const period = periodLabel(habit);
  const catDef = habit.category ? getCategoryDef(habit.category) : null;
  const streak = getIndividualStreak(habit, completions);

  return (
    <View style={[done.container, done.border]}>
      <View style={[done.stripe, { backgroundColor: catDef?.color ?? Colors.border }]} />
      <View style={done.body}>
        <View style={done.topLine}>
          <Text style={done.name} numberOfLines={1}>{habit.name}</Text>
          <StreakBadge streak={streak} habit={habit} />
        </View>
        <Text style={done.meta}>
          {habit.category ? `${habit.category} · ` : ''}
          {completed}/{target} {period}
        </Text>
      </View>
      <View style={done.doneChip}>
        <Feather name="check" size={11} color={Colors.success} />
        <Text style={done.doneText}>Done</Text>
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
    color: Colors.primary,
  },
  sectionTitleMuted: { color: Colors.textMuted },

  // Actions card
  actionsCard: { padding: 0, overflow: 'hidden' },

  caughtUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: Spacing.md,
  },
  caughtUpText: { ...Typography.body },

  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  expandText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600' as const,
  },

  completedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
  },
  completedToggleBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  completedToggleText: {
    ...Typography.bodySmall,
    color: Colors.success,
    fontWeight: '600' as const,
    flex: 1,
  },

  divider: { width: 1, height: 30, backgroundColor: Colors.border },

  // Overview
  overviewCard: { paddingVertical: Spacing.sm },
  overviewRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  overviewStat: { flex: 1, alignItems: 'center' },
  overviewNum: { fontSize: 22, fontWeight: '700' as const, color: Colors.textSecondary },
  overviewLabel: { ...Typography.bodySmall, marginTop: 2 },
  overviewBar: { height: 5, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  overviewBarFill: { height: '100%', borderRadius: 3 },

  // Weekly
  weekCard: { paddingVertical: Spacing.sm },
  weekRow: { flexDirection: 'row', alignItems: 'center' },
  weekStat: { flex: 1, alignItems: 'center' },
  weekNum: { fontSize: 22, fontWeight: '700' as const },
  weekLabel: { ...Typography.bodySmall, marginTop: 2 },
  motivLabel: { fontSize: 12, fontWeight: '700' as const, textAlign: 'center' },

  // Category
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
  catBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 2 },
  catProgress: { ...Typography.bodySmall, minWidth: 32, textAlign: 'right' },

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

  // Undo snackbar
  snackbar: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.md,
    right: Spacing.md,
  },
  snackbarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1F2937',
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  snackbarText: {
    ...Typography.bodySmall,
    color: Colors.surface,
    flex: 1,
  },
  snackbarUndo: {
    ...Typography.bodySmall,
    color: Colors.warning,
    fontWeight: '700' as const,
  },
});

const row = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 60,
  },
  border: { borderTopWidth: 1, borderTopColor: Colors.border },
  stripe: { width: 3, flexShrink: 0 },
  body: {
    flex: 1,
    paddingVertical: 10,
    paddingLeft: Spacing.sm,
    paddingRight: Spacing.sm,
    justifyContent: 'center',
    gap: 5,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    ...Typography.body,
    fontWeight: '600' as const,
    flex: 1,
  },
  bottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  meta: {
    ...Typography.bodySmall,
    flex: 1,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    flexShrink: 0,
  },
  btnText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600' as const,
    fontSize: 12,
  },
});

const done = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 52,
    opacity: 0.55,
  },
  border: { borderTopWidth: 1, borderTopColor: Colors.border },
  stripe: { width: 3, flexShrink: 0 },
  body: {
    flex: 1,
    paddingVertical: 9,
    paddingLeft: Spacing.sm,
    paddingRight: Spacing.sm,
    justifyContent: 'center',
    gap: 3,
  },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { ...Typography.body, fontWeight: '500' as const, flex: 1 },
  meta: { ...Typography.bodySmall },
  doneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.sm,
    flexShrink: 0,
  },
  doneText: {
    ...Typography.bodySmall,
    color: Colors.success,
    fontWeight: '600' as const,
  },
});
