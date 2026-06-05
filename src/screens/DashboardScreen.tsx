import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useHabits } from '../store/HabitContext';
import {
  getTodayStats,
  getWeeklyConsistency,
  getCurrentStreak,
  getHabitProgress,
} from '../utils/habitUtils';
import { Card } from '../components/Card';
import { HabitCard } from '../components/HabitCard';
import { Colors, Spacing, Typography, Radius } from '../theme';

export function DashboardScreen() {
  const { state, updateSettings } = useHabits();
  const { habits, completions, settings } = state;

  const activeHabits = habits.filter((h) => h.isActive);
  const todayStats = getTodayStats(activeHabits, completions);
  const weeklyConsistency = getWeeklyConsistency(activeHabits, completions);
  const streak = getCurrentStreak(activeHabits, completions);

  const greeting = getGreeting();
  const dashboardHabits = activeHabits.filter((h) => h.showOnDashboard);

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

        {/* Today's Progress */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: Colors.primaryLight }]}>
              <Feather name="sun" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Today's Progress</Text>
          </View>
          {todayStats.totalActions === 0 ? (
            <Text style={styles.emptyNote}>No daily habits yet. Add one on the Habits tab.</Text>
          ) : (
            <>
              <View style={styles.bigStatRow}>
                <Text style={styles.bigStat}>{todayStats.completedActions}</Text>
                <Text style={styles.bigStatDivider}>/</Text>
                <Text style={styles.bigStatTotal}>{todayStats.totalActions}</Text>
                <Text style={styles.bigStatLabel}>actions completed</Text>
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
              {todayStats.percentage >= 1 && (
                <Text style={styles.allDone}>All done for today!</Text>
              )}
            </>
          )}
        </Card>

        {/* Weekly Consistency */}
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
        </Card>

        {/* Streak / Momentum */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: Colors.warningLight }]}>
              <Feather name="zap" size={16} color={Colors.warning} />
            </View>
            <Text style={styles.cardTitle}>Momentum</Text>
          </View>
          <View style={styles.bigStatRow}>
            <Text style={[styles.bigStat, { color: Colors.warning }]}>{streak}</Text>
            <Text style={styles.bigStatLabel}>
              {streak === 1 ? 'day streak' : 'day streak'}
            </Text>
          </View>
          <Text style={styles.streakNote}>
            {streak === 0
              ? 'Complete all daily habits to start your streak.'
              : streak < 3
              ? "Keep it going — you're just getting started!"
              : streak < 7
              ? 'Nice work — momentum is building!'
              : "Incredible — don't break the chain!"}
          </Text>
        </Card>

        {/* Individual Habits Toggle */}
        <Card style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Show Individual Habits</Text>
              <Text style={styles.toggleSub}>
                Display habit-level progress cards on this dashboard
              </Text>
            </View>
            <Switch
              value={settings.showIndividualHabitsOnDashboard}
              onValueChange={(v) =>
                updateSettings({ showIndividualHabitsOnDashboard: v })
              }
              trackColor={{ true: Colors.primary }}
              thumbColor={Colors.surface}
            />
          </View>
        </Card>

        {/* Individual Habit Cards */}
        {settings.showIndividualHabitsOnDashboard && (
          <View>
            {dashboardHabits.length === 0 ? (
              <Card style={styles.card}>
                <Text style={styles.emptyNote}>
                  No habits have "Show on Dashboard" enabled. Edit a habit to turn it on.
                </Text>
              </Card>
            ) : (
              dashboardHabits.map((habit) => (
                <HabitCard key={habit.id} habit={habit} onEdit={() => {}} compact />
              ))
            )}
          </View>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
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
  cardTitle: { ...Typography.h3 },
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
  allDone: {
    ...Typography.bodySmall,
    color: Colors.success,
    fontWeight: '600' as const,
    marginTop: Spacing.xs,
  },
  streakNote: { ...Typography.bodySmall, marginTop: Spacing.xs },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { ...Typography.body, fontWeight: '500' as const, marginBottom: 2 },
  toggleSub: { ...Typography.bodySmall, paddingRight: Spacing.md },
  emptyNote: { ...Typography.bodySmall, fontStyle: 'italic' },
});
