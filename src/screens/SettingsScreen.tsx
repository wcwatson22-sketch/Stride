import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHabits } from '../store/HabitContext';
import { Card } from '../components/Card';
import { Colors, Spacing, Typography, Radius } from '../theme';

export function SettingsScreen() {
  const { state, updateSettings } = useHabits();

  function handleClearData() {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all habits and completions. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Done', 'All data has been cleared. Restart the app to see changes.');
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Dashboard section */}
        <Text style={styles.sectionLabel}>Dashboard</Text>
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Feather name="layout" size={16} color={Colors.primary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Show Individual Habits</Text>
              <Text style={styles.rowSub}>Display habit cards on your dashboard</Text>
            </View>
            <Switch
              value={state.settings.showIndividualHabitsOnDashboard}
              onValueChange={(v) => updateSettings({ showIndividualHabitsOnDashboard: v })}
              trackColor={{ true: Colors.primary }}
              thumbColor={Colors.surface}
            />
          </View>
        </Card>

        {/* About section */}
        <Text style={styles.sectionLabel}>About</Text>
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.primaryLight }]}>
              <Feather name="activity" size={16} color={Colors.primary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Stride</Text>
              <Text style={styles.rowSub}>Version 1.0.0 — Habit Tracker</Text>
            </View>
          </View>
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.xs }]}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.successLight }]}>
              <Feather name="shield" size={16} color={Colors.success} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Private by default</Text>
              <Text style={styles.rowSub}>All data is stored locally on your device</Text>
            </View>
          </View>
        </Card>

        {/* Stats summary */}
        <Text style={styles.sectionLabel}>Your Data</Text>
        <Card style={styles.card}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{state.habits.length}</Text>
              <Text style={styles.statLabel}>Total Habits</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {state.habits.filter((h) => h.isActive).length}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{state.completions.length}</Text>
              <Text style={styles.statLabel}>Completions</Text>
            </View>
          </View>
        </Card>

        {/* Danger zone */}
        <Text style={styles.sectionLabel}>Data</Text>
        <Card style={styles.card}>
          <TouchableOpacity style={styles.dangerRow} onPress={handleClearData}>
            <Feather name="trash-2" size={16} color="#EF4444" />
            <Text style={styles.dangerText}>Clear All Data</Text>
          </TouchableOpacity>
        </Card>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.md },
  headerSection: { paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  title: { ...Typography.h1 },
  sectionLabel: { ...Typography.label, marginTop: Spacing.lg, marginBottom: Spacing.xs },
  card: { marginBottom: Spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowLabel: { ...Typography.body, fontWeight: '500' as const },
  rowSub: { ...Typography.bodySmall, marginTop: 1 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', paddingVertical: Spacing.xs },
  statNumber: { fontSize: 28, fontWeight: '700' as const, color: Colors.primary },
  statLabel: { ...Typography.bodySmall, marginTop: 2 },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: Spacing.xs,
  },
  dangerText: { color: '#EF4444', fontWeight: '500' as const, fontSize: 15 },
});
