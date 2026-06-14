import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Habit } from '../models/types';
import { useHabits } from '../store/HabitContext';
import { HabitFormModal } from './HabitFormModal';
import { StreakBadge } from './StreakBadge';
import {
  getHabitProgress,
  getIndividualStreak,
  getBestStreak,
  getRecentHistory,
  getCompletedCountForPeriod,
  periodLabel,
  frequencyLabel,
  PeriodHistoryItem,
} from '../utils/habitUtils';
import { getCategoryDef } from '../constants/categories';
import { Colors, Spacing, Typography, Radius } from '../theme';

interface HabitDetailModalProps {
  habitId: string | null;
  onClose: () => void;
}

export function HabitDetailModal({ habitId, onClose }: HabitDetailModalProps) {
  const { state, logCompletion } = useHabits();
  const [editVisible, setEditVisible] = useState(false);

  // Always look up from live context so edits are reflected immediately
  const habit = habitId ? (state.habits.find((h) => h.id === habitId) ?? null) : null;

  if (!habit) return null;

  const { completions } = state;
  const { completed, target, percentage, done } = getHabitProgress(habit, completions);
  const period = periodLabel(habit);
  const freqSummary = frequencyLabel(habit);
  const streak = getIndividualStreak(habit, completions);
  const best = getBestStreak(habit, completions);
  const history = getRecentHistory(habit, completions);
  const catDef = habit.category ? getCategoryDef(habit.category) : null;

  const unitLabel =
    habit.frequencyType === 'daily'
      ? 'days'
      : habit.frequencyType === 'weekly'
      ? 'weeks'
      : 'months';

  function handleComplete() {
    if (done) return;
    const current = getCompletedCountForPeriod(habit, completions);
    if (current >= target) return;
    logCompletion(habit.id);
  }

  return (
    <>
      <Modal
        visible={!!habitId}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} hitSlop={8} style={s.headerSide}>
            <Feather name="x" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>{habit.name}</Text>
          <TouchableOpacity
            onPress={() => setEditVisible(true)}
            hitSlop={8}
            style={s.headerSide}
          >
            <Text style={s.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ──────────────────────────────────────────────────────────── */}
          <View style={s.hero}>
            {catDef && (
              <View style={[s.catPill, { backgroundColor: catDef.lightBg }]}>
                <View style={[s.catDot, { backgroundColor: catDef.color }]} />
                <Text style={[s.catPillText, { color: catDef.color }]}>
                  {habit.category}
                </Text>
              </View>
            )}
            <Text style={s.heroName}>{habit.name}</Text>
            <Text style={s.heroFreq}>{freqSummary}</Text>
            {!habit.isActive && (
              <View style={s.pausedBadge}>
                <Text style={s.pausedText}>Paused</Text>
              </View>
            )}
          </View>

          {/* ── Progress ──────────────────────────────────────────────────────── */}
          <SectionLabel title="PROGRESS" />
          <View style={s.card}>
            <View style={s.progressNumRow}>
              <Text style={[s.bigNum, { color: done ? Colors.success : Colors.primary }]}>
                {completed}
              </Text>
              <Text style={s.bigSlash}> / </Text>
              <Text style={s.bigTotal}>{target}</Text>
              <Text style={s.bigPeriod}> {period}</Text>
            </View>
            <View style={s.progressBar}>
              <View
                style={[
                  s.progressFill,
                  {
                    width: `${percentage * 100}%`,
                    backgroundColor: done
                      ? Colors.success
                      : catDef?.color ?? Colors.primary,
                  },
                ]}
              />
            </View>
            <View style={s.progressAction}>
              {done ? (
                <View style={s.doneRow}>
                  <Feather name="check-circle" size={16} color={Colors.success} />
                  <Text style={s.doneText}>Done for {period}!</Text>
                </View>
              ) : habit.isActive ? (
                <TouchableOpacity
                  style={[
                    s.completeBtn,
                    { backgroundColor: catDef?.color ?? Colors.primary },
                  ]}
                  onPress={handleComplete}
                  activeOpacity={0.85}
                >
                  <Feather name="plus" size={15} color={Colors.surface} />
                  <Text style={s.completeBtnText}>Complete</Text>
                </TouchableOpacity>
              ) : (
                <Text style={s.pausedNote}>Habit is paused</Text>
              )}
            </View>
          </View>

          {/* ── Streak ────────────────────────────────────────────────────────── */}
          <SectionLabel title="STREAK" />
          <View style={[s.card, s.streakCard]}>
            <View style={s.streakItem}>
              <View style={s.streakIconRow}>
                <Feather
                  name="zap"
                  size={22}
                  color={streak > 0 ? Colors.warning : Colors.textMuted}
                />
                <Text
                  style={[
                    s.streakNum,
                    { color: streak > 0 ? Colors.warning : Colors.textMuted },
                  ]}
                >
                  {streak}
                </Text>
              </View>
              <Text style={s.streakLabel}>current {unitLabel}</Text>
            </View>

            <View style={s.streakDivider} />

            <View style={s.streakItem}>
              <View style={s.streakIconRow}>
                <Feather
                  name="award"
                  size={22}
                  color={best > 0 ? '#F59E0B' : Colors.textMuted}
                />
                <Text
                  style={[
                    s.streakNum,
                    { color: best > 0 ? '#F59E0B' : Colors.textMuted },
                  ]}
                >
                  {best}
                </Text>
              </View>
              <Text style={s.streakLabel}>best ever</Text>
            </View>
          </View>

          {/* ── Recent History ────────────────────────────────────────────────── */}
          <SectionLabel title="RECENT HISTORY" />
          <View style={s.card}>
            <View style={s.historyRow}>
              {history.map((item, idx) => (
                <HistoryCell key={idx} item={item} catColor={catDef?.color} />
              ))}
            </View>
          </View>

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      </Modal>

      {/* Edit form — layered on top of the detail modal */}
      <HabitFormModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        editingHabit={habit}
      />
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return <Text style={s.sectionLabel}>{title}</Text>;
}

function HistoryCell({
  item,
  catColor,
}: {
  item: PeriodHistoryItem;
  catColor?: string;
}) {
  const { label, status } = item;

  let iconName: string;
  let iconColor: string;
  let bg: string;

  switch (status) {
    case 'complete':
      iconName = 'check';
      iconColor = Colors.success;
      bg = Colors.successLight;
      break;
    case 'current':
      iconName = 'clock';
      iconColor = catColor ?? Colors.primary;
      bg = Colors.primaryLight;
      break;
    default:
      iconName = 'minus';
      iconColor = Colors.textMuted;
      bg = Colors.border;
  }

  return (
    <View style={hist.cell}>
      <View style={[hist.icon, { backgroundColor: bg }]}>
        <Feather name={iconName as any} size={11} color={iconColor} />
      </View>
      <Text style={hist.label}>{label}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerSide: { width: 48 },
  headerTitle: {
    ...Typography.h3,
    flex: 1,
    textAlign: 'center',
  },
  editText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600' as const,
    textAlign: 'right',
  },

  scroll: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  // Hero
  hero: {
    paddingBottom: Spacing.md,
    gap: 6,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.xl,
  },
  catDot: { width: 7, height: 7, borderRadius: 3.5 },
  catPillText: { fontSize: 12, fontWeight: '600' as const },
  heroName: { ...Typography.h1, lineHeight: 34 },
  heroFreq: { ...Typography.bodySmall },
  pausedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pausedText: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    color: Colors.textMuted,
    marginTop: Spacing.md,
    marginBottom: 6,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 0,
  },

  // Progress
  progressNumRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  bigNum: { fontSize: 40, fontWeight: '700' as const },
  bigSlash: { fontSize: 24, color: Colors.textSecondary },
  bigTotal: { fontSize: 28, fontWeight: '600' as const, color: Colors.textSecondary },
  bigPeriod: { ...Typography.bodySmall, marginLeft: 4 },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressAction: { alignItems: 'flex-start' },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  doneText: { ...Typography.body, color: Colors.success, fontWeight: '500' as const },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    borderRadius: Radius.xl,
  },
  completeBtnText: { color: Colors.surface, fontWeight: '700' as const, fontSize: 15 },
  pausedNote: { ...Typography.bodySmall, fontStyle: 'italic' },

  // Streak
  streakCard: { flexDirection: 'row', alignItems: 'center' },
  streakItem: { flex: 1, alignItems: 'center', gap: 4 },
  streakIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakNum: { fontSize: 32, fontWeight: '700' as const },
  streakLabel: { ...Typography.bodySmall },
  streakDivider: { width: 1, height: 48, backgroundColor: Colors.border },

  // History
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

const hist = StyleSheet.create({
  cell: { alignItems: 'center', gap: 5, flex: 1 },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
