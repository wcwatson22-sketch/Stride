export interface CategoryDef {
  name: string;
  color: string;     // accent color for dot, border, badge text
  lightBg: string;  // soft background for pill badge
}

export const CATEGORIES: CategoryDef[] = [
  { name: 'Fitness',    color: '#10B981', lightBg: '#ECFDF5' },
  { name: 'Spiritual',  color: '#8B5CF6', lightBg: '#F5F3FF' },
  { name: 'Financial',  color: '#F59E0B', lightBg: '#FFFBEB' },
  { name: 'Health',     color: '#F43F5E', lightBg: '#FFF1F2' },
  { name: 'Family',     color: '#EC4899', lightBg: '#FDF2F8' },
  { name: 'Personal',   color: '#4A6CF7', lightBg: '#EEF1FE' },
  { name: 'Work',       color: '#0EA5E9', lightBg: '#F0F9FF' },
  { name: 'Other',      color: '#6B7280', lightBg: '#F9FAFB' },
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

export function getCategoryDef(name: string): CategoryDef {
  return (
    CATEGORIES.find((c) => c.name === name) ?? {
      name,
      color: '#6B7280',
      lightBg: '#F9FAFB',
    }
  );
}
