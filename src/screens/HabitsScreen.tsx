import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useHabits } from '../store/HabitContext';
import { Habit, FrequencyType } from '../models/types';
import { HabitCard } from '../components/HabitCard';
import { HabitFormModal } from '../components/HabitFormModal';
import { Colors, Spacing, Typography, Radius } from '../theme';

type FilterTab = 'all' | 'daily' | 'weekly' | 'monthly';

const FREQUENCY_SECTIONS: { label: string; value: FrequencyType }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

export function HabitsScreen() {
  const { state } = useHabits();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [showInactive, setShowInactive] = useState(false);

  function openAdd() {
    setEditingHabit(null);
    setModalVisible(true);
  }

  function openEdit(habit: Habit) {
    setEditingHabit(habit);
    setModalVisible(true);
  }

  // For grouped "All" view: pass both active + paused (GroupedHabitList separates them).
  // For flat frequency-filtered view: always show only active habits matching that frequency.
  const baseHabits = state.habits.filter((h) => showInactive || h.isActive);
  const totalActive = state.habits.filter((h) => h.isActive).length;
  const totalPaused = state.habits.filter((h) => !h.isActive).length;

  const filterTabs: { label: string; value: FilterTab }[] = [
    { label: 'All', value: 'all' },
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
  ];

  // When a specific frequency is selected, show a flat list with no section headers.
  // When "all" is selected, group into sections.
  const showGrouped = filter === 'all';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Habits</Text>
          <Text style={styles.subtitle}>
            {totalActive} active{totalPaused > 0 ? ` · ${totalPaused} paused` : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
          <Feather name="plus" size={20} color={Colors.surface} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.filterTab, filter === tab.value && styles.filterTabActive]}
            onPress={() => setFilter(tab.value)}
          >
            <Text style={[styles.filterTabText, filter === tab.value && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.filterTab, showInactive && styles.filterTabActive]}
          onPress={() => setShowInactive((v) => !v)}
        >
          <Text style={[styles.filterTabText, showInactive && styles.filterTabTextActive]}>
            {showInactive ? 'Hide Paused' : '+ Paused'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {state.habits.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="clipboard" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptyBody}>Tap "Add" to create your first habit.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openAdd}>
              <Text style={styles.emptyBtnText}>Create a habit</Text>
            </TouchableOpacity>
          </View>
        ) : showGrouped ? (
          <GroupedHabitList
            habits={baseHabits}
            onEdit={openEdit}
          />
        ) : (
          <FlatHabitList
            habits={baseHabits.filter((h) => h.frequencyType === filter)}
            frequencyLabel={filter}
            onEdit={openEdit}
          />
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      <HabitFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        editingHabit={editingHabit}
      />
    </SafeAreaView>
  );
}

function GroupedHabitList({
  habits,
  onEdit,
}: {
  habits: Habit[];
  onEdit: (h: Habit) => void;
}) {
  const activeHabits = habits.filter((h) => h.isActive);
  const pausedHabits = habits.filter((h) => !h.isActive);

  return (
    <>
      {/* Active habits grouped by frequency */}
      {FREQUENCY_SECTIONS.map(({ label, value }) => {
        const group = activeHabits.filter((h) => h.frequencyType === value);
        if (group.length === 0) return null;
        return (
          <View key={value}>
            <View style={groupStyles.sectionHeader}>
              <Text style={groupStyles.sectionLabel}>{label}</Text>
              <View style={groupStyles.pill}>
                <Text style={groupStyles.pillText}>{group.length}</Text>
              </View>
            </View>
            {group.map((habit) => (
              <HabitCard key={habit.id} habit={habit} onEdit={onEdit} />
            ))}
          </View>
        );
      })}

      {/* Paused habits — separate section at the bottom */}
      {pausedHabits.length > 0 && (
        <View>
          <View style={groupStyles.sectionHeader}>
            <Text style={groupStyles.sectionLabel}>Paused</Text>
            <View style={[groupStyles.pill, groupStyles.pillMuted]}>
              <Text style={[groupStyles.pillText, groupStyles.pillTextMuted]}>
                {pausedHabits.length}
              </Text>
            </View>
          </View>
          {pausedHabits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onEdit={onEdit} />
          ))}
        </View>
      )}
    </>
  );
}

function FlatHabitList({
  habits,
  frequencyLabel,
  onEdit,
}: {
  habits: Habit[];
  frequencyLabel: string;
  onEdit: (h: Habit) => void;
}) {
  if (habits.length === 0) {
    return (
      <View style={styles.empty}>
        <Feather name="filter" size={32} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No {frequencyLabel} habits</Text>
        <Text style={styles.emptyBody}>Change the filter or add a new habit.</Text>
      </View>
    );
  }
  return (
    <>
      {habits.map((habit) => (
        <HabitCard key={habit.id} habit={habit} onEdit={onEdit} />
      ))}
    </>
  );
}

const groupStyles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sectionLabel: {
    ...Typography.label,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: Colors.textSecondary,
  },
  pill: {
    backgroundColor: Colors.border,
    borderRadius: Radius.xl,
    minWidth: 20,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  pillMuted: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillTextMuted: {
    color: Colors.textMuted,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: { ...Typography.h1 },
  subtitle: { ...Typography.bodySmall, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.xl,
  },
  addBtnText: { color: Colors.surface, fontWeight: '600' as const, fontSize: 15 },
  filterScroll: { flexGrow: 0 },
  filterContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterTabActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  filterTabText: { ...Typography.bodySmall },
  filterTabTextActive: { color: Colors.primary, fontWeight: '600' as const },
  list: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { ...Typography.h3, color: Colors.textSecondary },
  emptyBody: { ...Typography.bodySmall, textAlign: 'center', maxWidth: 260 },
  emptyBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: Radius.xl,
  },
  emptyBtnText: { color: Colors.surface, fontWeight: '600' as const, fontSize: 15 },
});
