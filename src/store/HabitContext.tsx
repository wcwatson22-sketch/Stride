import React, { createContext, useContext, useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, HabitCompletion } from '../models/types';

const HABITS_KEY = '@stride/habits';
const COMPLETIONS_KEY = '@stride/completions';
const SETTINGS_KEY = '@stride/settings';

interface AppSettings {
  showIndividualHabitsOnDashboard: boolean;
}

interface State {
  habits: Habit[];
  completions: HabitCompletion[];
  settings: AppSettings;
  loaded: boolean;
}

type Action =
  | { type: 'LOAD'; payload: State }
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'UPDATE_HABIT'; payload: Habit }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'ADD_COMPLETION'; payload: HabitCompletion }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD':
      return { ...action.payload, loaded: true };
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] };
    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map((h) =>
          h.id === action.payload.id ? action.payload : h
        ),
      };
    case 'DELETE_HABIT':
      return {
        ...state,
        habits: state.habits.filter((h) => h.id !== action.payload),
        completions: state.completions.filter((c) => c.habitId !== action.payload),
      };
    case 'ADD_COMPLETION':
      return { ...state, completions: [...state.completions, action.payload] };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    default:
      return state;
  }
}

const defaultState: State = {
  habits: [],
  completions: [],
  settings: { showIndividualHabitsOnDashboard: false },
  loaded: false,
};

interface ContextValue {
  state: State;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateHabit: (habit: Habit) => void;
  deleteHabit: (id: string) => void;
  logCompletion: (habitId: string, count?: number, note?: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

const HabitContext = createContext<ContextValue | null>(null);

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Migrate a raw habit record from AsyncStorage to the current model shape. */
function migrateHabit(raw: any): Habit {
  return {
    showOnDashboard: false,
    ...raw,
    // isPinned migrates from legacy showOnDashboard if not already set
    isPinned: raw.isPinned ?? raw.showOnDashboard ?? false,
  };
}

export function HabitProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState);

  useEffect(() => {
    async function load() {
      try {
        const [habitsRaw, completionsRaw, settingsRaw] = await Promise.all([
          AsyncStorage.getItem(HABITS_KEY),
          AsyncStorage.getItem(COMPLETIONS_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
        ]);
        dispatch({
          type: 'LOAD',
          payload: {
            habits: habitsRaw
              ? (JSON.parse(habitsRaw) as any[]).map(migrateHabit)
              : [],
            completions: completionsRaw ? JSON.parse(completionsRaw) : [],
            settings: settingsRaw ? JSON.parse(settingsRaw) : defaultState.settings,
            loaded: true,
          },
        });
      } catch {
        dispatch({ type: 'LOAD', payload: { ...defaultState, loaded: true } });
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!state.loaded) return;
    AsyncStorage.setItem(HABITS_KEY, JSON.stringify(state.habits));
    AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(state.completions));
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  }, [state.habits, state.completions, state.settings, state.loaded]);

  function addHabit(data: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    dispatch({
      type: 'ADD_HABIT',
      payload: { ...data, id: generateId(), createdAt: now, updatedAt: now },
    });
  }

  function updateHabit(habit: Habit) {
    dispatch({
      type: 'UPDATE_HABIT',
      payload: { ...habit, updatedAt: new Date().toISOString() },
    });
  }

  function deleteHabit(id: string) {
    dispatch({ type: 'DELETE_HABIT', payload: id });
  }

  function logCompletion(habitId: string, count = 1, note = '') {
    const now = new Date().toISOString();
    dispatch({
      type: 'ADD_COMPLETION',
      payload: {
        id: generateId(),
        habitId,
        completedAt: now,
        count,
        note,
        createdAt: now,
      },
    });
  }

  function updateSettings(settings: Partial<AppSettings>) {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }

  return (
    <HabitContext.Provider
      value={{ state, addHabit, updateHabit, deleteHabit, logCompletion, updateSettings }}
    >
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits() {
  const ctx = useContext(HabitContext);
  if (!ctx) throw new Error('useHabits must be used within HabitProvider');
  return ctx;
}
