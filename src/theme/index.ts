export const Colors = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  primary: '#4A6CF7',
  primaryLight: '#EEF1FE',
  success: '#34C759',
  successLight: '#E8F8ED',
  warning: '#FF9500',
  warningLight: '#FFF3E0',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  tabBar: '#FFFFFF',
  tabBarActive: '#4A6CF7',
  tabBarInactive: '#9CA3AF',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: Colors.text },
  h2: { fontSize: 22, fontWeight: '700' as const, color: Colors.text },
  h3: { fontSize: 18, fontWeight: '600' as const, color: Colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: Colors.text },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, color: Colors.textSecondary },
  label: { fontSize: 12, fontWeight: '500' as const, color: Colors.textMuted },
  caption: { fontSize: 11, fontWeight: '400' as const, color: Colors.textMuted },
};
