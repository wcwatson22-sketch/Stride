import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Habit, FrequencyType } from '../models/types';
import { useHabits } from '../store/HabitContext';
import { Colors, Spacing, Radius, Typography } from '../theme';

interface HabitFormModalProps {
  visible: boolean;
  onClose: () => void;
  editingHabit?: Habit | null;
}

const FREQUENCY_OPTIONS: { label: string; value: FrequencyType }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

const CATEGORIES = ['Health', 'Fitness', 'Family', 'Spiritual', 'Learning', 'Other'];

export function HabitFormModal({ visible, onClose, editingHabit }: HabitFormModalProps) {
  const { state, addHabit, updateHabit, deleteHabit } = useHabits();

  // Check if the habit has any completion history
  const hasCompletions = editingHabit
    ? state.completions.some((c) => c.habitId === editingHabit.id)
    : false;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('daily');
  const [targetCount, setTargetCount] = useState('1');
  const [showOnDashboard, setShowOnDashboard] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (editingHabit) {
      setName(editingHabit.name);
      setCategory(editingHabit.category);
      setFrequencyType(editingHabit.frequencyType);
      setTargetCount(String(editingHabit.targetCount));
      setShowOnDashboard(editingHabit.showOnDashboard);
      setIsActive(editingHabit.isActive);
    } else {
      setName('');
      setCategory('');
      setFrequencyType('daily');
      setTargetCount('1');
      setShowOnDashboard(false);
      setIsActive(true);
    }
  }, [editingHabit, visible]);

  function handleSave() {
    if (!name.trim()) return;
    const count = Math.max(1, parseInt(targetCount) || 1);
    const data = {
      name: name.trim(),
      category,
      frequencyType,
      targetCount: count,
      showOnDashboard,
      isActive,
    };
    if (editingHabit) {
      updateHabit({ ...editingHabit, ...data });
    } else {
      addHabit(data);
    }
    onClose();
  }

  function handleArchive() {
    if (!editingHabit) return;
    updateHabit({ ...editingHabit, isActive: false, updatedAt: new Date().toISOString() });
    onClose();
  }

  function handleDelete() {
    if (!editingHabit) return;
    if (hasCompletions) {
      Alert.alert(
        'Delete Habit',
        'This habit has completion history. Deleting it will permanently remove all its records.\n\nConsider archiving it instead to preserve your history.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Archive Instead',
            onPress: () => { handleArchive(); },
          },
          {
            text: 'Delete Permanently',
            style: 'destructive',
            onPress: () => { deleteHabit(editingHabit.id); onClose(); },
          },
        ]
      );
    } else {
      Alert.alert(
        'Delete Habit',
        `Are you sure you want to delete "${editingHabit.name}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => { deleteHabit(editingHabit.id); onClose(); },
          },
        ]
      );
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Feather name="x" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>{editingHabit ? 'Edit Habit' : 'New Habit'}</Text>
          <TouchableOpacity onPress={handleSave} hitSlop={8}>
            <Text style={styles.saveBtn}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Habit name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Brush Teeth"
            placeholderTextColor={Colors.textMuted}
            autoFocus
          />

          <Text style={styles.label}>Category (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => setCategory(category === cat ? '' : cat)}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Frequency</Text>
          <View style={styles.freqRow}>
            {FREQUENCY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.freqBtn, frequencyType === opt.value && styles.freqBtnActive]}
                onPress={() => setFrequencyType(opt.value)}
              >
                <Text
                  style={[
                    styles.freqBtnText,
                    frequencyType === opt.value && styles.freqBtnTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>
            Target count per{' '}
            {frequencyType === 'daily' ? 'day' : frequencyType === 'weekly' ? 'week' : 'month'}
          </Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setTargetCount(String(Math.max(1, (parseInt(targetCount) || 1) - 1)))}
            >
              <Feather name="minus" size={18} color={Colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.counterInput}
              value={targetCount}
              onChangeText={(v) => setTargetCount(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              textAlign="center"
            />
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setTargetCount(String((parseInt(targetCount) || 1) + 1))}
            >
              <Feather name="plus" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Show on Dashboard</Text>
              <Text style={styles.toggleSub}>Display this habit individually on your dashboard</Text>
            </View>
            <Switch
              value={showOnDashboard}
              onValueChange={setShowOnDashboard}
              trackColor={{ true: Colors.primary }}
              thumbColor={Colors.surface}
            />
          </View>

          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Active</Text>
              <Text style={styles.toggleSub}>Inactive habits are hidden from your daily view</Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ true: Colors.primary }}
              thumbColor={Colors.surface}
            />
          </View>

          {editingHabit && (
            <View style={styles.dangerSection}>
              {editingHabit.isActive && (
                <TouchableOpacity style={styles.archiveBtn} onPress={handleArchive}>
                  <Feather name="pause-circle" size={16} color={Colors.textSecondary} />
                  <Text style={styles.archiveBtnText}>Archive (Pause) Habit</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Feather name="trash-2" size={16} color="#EF4444" />
                <Text style={styles.deleteBtnText}>Delete Habit</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  title: { ...Typography.h3 },
  saveBtn: { ...Typography.body, color: Colors.primary, fontWeight: '600' as const },
  form: { flex: 1, paddingHorizontal: Spacing.md, paddingTop: Spacing.lg },
  label: { ...Typography.label, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    ...Typography.body,
  },
  chips: { flexDirection: 'row', marginBottom: Spacing.xs },
  chip: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginRight: Spacing.xs,
    backgroundColor: Colors.surface,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  chipText: { ...Typography.bodySmall },
  chipTextActive: { color: Colors.primary, fontWeight: '600' as const },
  freqRow: { flexDirection: 'row', gap: Spacing.xs },
  freqBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  freqBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  freqBtnText: { ...Typography.bodySmall },
  freqBtnTextActive: { color: Colors.primary, fontWeight: '600' as const },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  counterBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterInput: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    ...Typography.h3,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toggleLabel: { ...Typography.body, fontWeight: '500' as const, marginBottom: 2 },
  toggleSub: { ...Typography.bodySmall, maxWidth: '80%' },
  dangerSection: { marginTop: Spacing.xl, gap: Spacing.sm },
  archiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.border,
    justifyContent: 'center',
  },
  archiveBtnText: { color: Colors.textSecondary, fontWeight: '600' as const, fontSize: 15 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
  },
  deleteBtnText: { color: '#EF4444', fontWeight: '600' as const, fontSize: 15 },
});
