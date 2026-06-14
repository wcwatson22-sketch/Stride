import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Habit } from '../models/types';
import { useHabits } from '../store/HabitContext';
import { getHabitProgress, frequencyLabel, periodLabel, getIndividualStreak } from '../utils/habitUtils';
import { getCategoryDef } from '../constants/categories';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { Card } from './Card';
import { StreakBadge } from './StreakBadge';

interface HabitCardProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
  compact?: boolean;
}

export function HabitCard({ habit, onEdit, compact = false }: HabitCardProps) {
  const { state, logCompletion } = useHabits();
  const { completed, target, percentage, done } = getHabitProgress(
    habit,
    state.completions
  );

  const period = periodLabel(habit);
  const barColor = done ? Colors.success : Colors.primary;
  const catDef = habit.category ? getCategoryDef(habit.category) : null;
  const streak = getIndividualStreak(habit, state.completions);

  function handleLog() {
    if (done) return;
    logCompletion(habit.id);
  }

  // ── Compact variant (used in "Individual Progress" section) ────────────────
  if (compact) {
    return (
      <Card
        style={[
          styles.compact,
          catDef ? { borderLeftWidth: 3, borderLeftColor: catDef.color } : null,
        ]}
      >
        <View style={styles.compactRow}>
          {catDef ? (
            <View style={[styles.dot, { backgroundColor: catDef.color }]} />
          ) : (
            <View style={[styles.dot, { backgroundColor: done ? Colors.success : Colors.primary }]} />
          )}
          <Text style={styles.compactName} numberOfLines={1}>{habit.name}</Text>
          <Text style={styles.compactCount}>
            {completed}/{target} {period}
          </Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${percentage * 100}%`, backgroundColor: barColor }]} />
        </View>
      </Card>
    );
  }

  // ── Full card ──────────────────────────────────────────────────────────────
  return (
    <Card
      style={[
        styles.card,
        !habit.isActive && styles.cardInactive,
        catDef ? { borderLeftWidth: 3, borderLeftColor: catDef.color } : null,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.info}>
          {/* Name row: name + status badges */}
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{habit.name}</Text>
            {!habit.isActive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Paused</Text>
              </View>
            )}
          </View>
          {/* Meta row: category pill + frequency + streak */}
          <View style={styles.meta}>
            {catDef && (
              <View style={[styles.catBadge, { backgroundColor: catDef.lightBg }]}>
                <View style={[styles.catDot, { backgroundColor: catDef.color }]} />
                <Text style={[styles.catBadgeText, { color: catDef.color }]}>
                  {habit.category}
                </Text>
              </View>
            )}
            <Text style={styles.freq}>{frequencyLabel(habit)}</Text>
            <View style={styles.metaDivider} />
            <StreakBadge streak={streak} habit={habit} showUnit />
          </View>
        </View>
        <TouchableOpacity onPress={() => onEdit(habit)} style={styles.editBtn} hitSlop={8}>
          <Feather name="more-horizontal" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${percentage * 100}%`, backgroundColor: barColor },
            ]}
          />
        </View>
        <Text style={styles.countText}>
          {completed}/{target} {period}
        </Text>
      </View>

      {/* Action row */}
      {habit.isActive && !done && (
        <TouchableOpacity
          style={styles.logBtn}
          onPress={handleLog}
          activeOpacity={0.75}
        >
          <Feather name="check" size={14} color={Colors.primary} />
          <Text style={styles.logBtnText}>+ Complete</Text>
        </TouchableOpacity>
      )}
      {done && (
        <View style={styles.doneRow}>
          <Feather name="check-circle" size={14} color={Colors.success} />
          <Text style={styles.doneText}>Done for {period}!</Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.sm },
  cardInactive: { opacity: 0.65 },

  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  info: { flex: 1 },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  name: { ...Typography.h3, flexShrink: 1 },

  inactiveBadge: {
    backgroundColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  inactiveBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },

  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  metaDivider: { width: 1, height: 10, backgroundColor: Colors.border },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  catDot: { width: 6, height: 6, borderRadius: 3 },
  catBadgeText: { fontSize: 11, fontWeight: '600' as const },
  freq: { ...Typography.bodySmall },

  editBtn: { padding: Spacing.xs },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  countText: { ...Typography.bodySmall, minWidth: 80, textAlign: 'right' },

  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
  },
  logBtnText: { ...Typography.bodySmall, color: Colors.primary, fontWeight: '600' as const },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doneText: { ...Typography.bodySmall, color: Colors.success },

  // Compact variant
  compact: { marginBottom: Spacing.xs, padding: Spacing.sm },
  compactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8, flexShrink: 0 },
  compactName: { ...Typography.body, flex: 1 },
  compactCount: { ...Typography.bodySmall },
});
