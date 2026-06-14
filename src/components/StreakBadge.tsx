import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Habit } from '../models/types';
import { Colors, Typography } from '../theme';

interface StreakBadgeProps {
  streak: number;
  habit: Habit;
  /** When true, appends the period word ("days" / "weeks" / "months") */
  showUnit?: boolean;
}

function unitLabel(habit: Habit): string {
  switch (habit.frequencyType) {
    case 'daily':   return 'days';
    case 'weekly':  return 'weeks';
    case 'monthly': return 'months';
  }
}

export function StreakBadge({ streak, habit, showUnit = false }: StreakBadgeProps) {
  const hasStreak = streak > 0;
  const color = hasStreak ? Colors.warning : Colors.textMuted;

  return (
    <View style={styles.row}>
      <Feather name="zap" size={11} color={color} />
      <Text style={[styles.text, { color }]}>
        {hasStreak
          ? showUnit
            ? `${streak} ${unitLabel(habit)}`
            : `${streak}`
          : '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  text: {
    ...Typography.bodySmall,
    fontSize: 11,
    fontWeight: '600' as const,
  },
});
