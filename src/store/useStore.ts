import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Session, Tray, Settings } from '../types';

interface StoreState extends AppState {
  // Actions
  putIn: () => void;
  takeOut: () => void;
  undo: () => void;
  clearUndo: () => void;
  nextTray: () => void;
  updateTray: (id: string, updates: Partial<Tray>) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  importData: (importedState: Omit<AppState, 'undoStack'>) => boolean;
  resetData: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  reminderMinutes: 45,
  dailyGoalMinutes: 22 * 60, // 22 hours
  use24HourClock: false,
  darkMode: 'system',
};

const getInitialTray = (): Tray => ({
  id: 'initial-tray',
  number: 1,
  startedAt: Date.now(),
  expectedEnd: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days default
});

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      currentState: 'out',
      lastTransition: Date.now(),
      sessions: [],
      trays: [getInitialTray()],
      settings: DEFAULT_SETTINGS,
      undoStack: null,

      putIn: () => {
        const now = Date.now();
        const state = get();

        // Prevent duplicate actions
        if (state.currentState === 'wearing') return;

        // Save current state for undo
        const undoState = {
          currentState: state.currentState,
          lastTransition: state.lastTransition,
          sessions: [...state.sessions],
          trays: [...state.trays],
        };

        // Create new session
        const newSession: Session = {
          id: Math.random().toString(36).substring(2, 9),
          start: now,
        };

        set({
          currentState: 'wearing',
          lastTransition: now,
          sessions: [...state.sessions, newSession],
          undoStack: undoState,
        });
      },

      takeOut: () => {
        const now = Date.now();
        const state = get();

        // Prevent duplicate actions
        if (state.currentState === 'out') return;

        // Save current state for undo
        const undoState = {
          currentState: state.currentState,
          lastTransition: state.lastTransition,
          sessions: [...state.sessions],
          trays: [...state.trays],
        };

        // Close the open session
        const updatedSessions = state.sessions.map((session) => {
          if (!session.end) {
            return { ...session, end: now };
          }
          return session;
        });

        set({
          currentState: 'out',
          lastTransition: now,
          sessions: updatedSessions,
          undoStack: undoState,
        });
      },

      undo: () => {
        const state = get();
        if (!state.undoStack) return;

        set({
          currentState: state.undoStack.currentState,
          lastTransition: state.undoStack.lastTransition,
          sessions: state.undoStack.sessions,
          trays: state.undoStack.trays,
          undoStack: null,
        });
      },

      clearUndo: () => {
        set({ undoStack: null });
      },

      nextTray: () => {
        const now = Date.now();
        const state = get();
        
        // Save current state for undo
        const undoState = {
          currentState: state.currentState,
          lastTransition: state.lastTransition,
          sessions: [...state.sessions],
          trays: [...state.trays],
        };

        const highestTrayNum = state.trays.reduce((max, t) => (t.number > max ? t.number : max), 0);
        const nextNum = highestTrayNum + 1;

        const nextTrayObj: Tray = {
          id: Math.random().toString(36).substring(2, 9),
          number: nextNum,
          startedAt: now,
          expectedEnd: now + 7 * 24 * 60 * 60 * 1000, // 7 days
        };

        set({
          trays: [...state.trays, nextTrayObj],
          undoStack: undoState,
        });
      },

      updateTray: (id, updates) => {
        const state = get();

        // Save current state for undo
        const undoState = {
          currentState: state.currentState,
          lastTransition: state.lastTransition,
          sessions: [...state.sessions],
          trays: [...state.trays],
        };

        const updatedTrays = state.trays.map((t) => {
          if (t.id === id) {
            return { ...t, ...updates };
          }
          return t;
        });

        set({
          trays: updatedTrays,
          undoStack: undoState,
        });
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      importData: (importedState) => {
        try {
          if (
            importedState &&
            typeof importedState.currentState === 'string' &&
            Array.isArray(importedState.sessions) &&
            Array.isArray(importedState.trays) &&
            importedState.settings
          ) {
            set({
              currentState: importedState.currentState,
              lastTransition: importedState.lastTransition || Date.now(),
              sessions: importedState.sessions,
              trays: importedState.trays,
              settings: { ...DEFAULT_SETTINGS, ...importedState.settings },
              undoStack: null,
            });
            return true;
          }
          return false;
        } catch (e) {
          console.error('Import failed', e);
          return false;
        }
      },

      resetData: () => {
        set({
          currentState: 'out',
          lastTransition: Date.now(),
          sessions: [],
          trays: [getInitialTray()],
          settings: DEFAULT_SETTINGS,
          undoStack: null,
        });
      },
    }),
    {
      name: 'align-track-state',
      partialize: (state) => ({
        currentState: state.currentState,
        lastTransition: state.lastTransition,
        sessions: state.sessions,
        trays: state.trays,
        settings: state.settings,
      }),
    }
  )
);
