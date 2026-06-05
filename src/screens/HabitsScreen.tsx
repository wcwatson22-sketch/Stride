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
import { Habit } from '../models/types';
import { HabitCard } from '../components/HabitCard';
import { HabitFormModal } from '../components/HabitFormModal';
import { Colors, Spacing, Typography, Radius } from '../theme';

type FilterTab = 'all' | 'daily' | 'weekly' | 'monthly';

export function HabitsScreen() {
  const { state } = useHabits();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [showInactive, setShowInactive] = useState(false);

  const filtered = state.habits.filter((h) => {
    if (!showInactive && !h.isActive) return false;
    if (filter !== 'all' && h.frequencyType !== filter) return false;
    return true;
  });

  function openAdd() {
    setEditingHabit(null);
    setModalVisible(true);
  }

  function openEdit(habit: Habit) {
    setEditingHabit(habit);
    setModalVisible(true);
  }

  const filterTabs: { label: string; value: FilterTab }[] = [
    { label: 'All', value: 'all' },
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Habits</Text>
          <Text style={styles.subtitle}>{state.habits.filter((h) => h.isActive).length} active habits</Text>
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
            + Inactive
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="clipboard" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No habits here</Text>
            <Text style={styles.emptyBody}>
              {state.habits.length === 0
                ? 'Tap "Add" to create your first habit.'
                : 'Change the filter to see your habits.'}
            </Text>
            {state.habits.length === 0 && (
              <TouchableOpacity style={styles.emptyBtn} onPress={openAdd}>
                <Text style={styles.emptyBtnText}>Create a habit</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filtered.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onEdit={openEdit} />
          ))
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
