import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { startOfDay } from 'date-fns';
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
  completeOnboarding: (params: {
    currentTrayNum: number;
    startedAtMs: number;
    isWearingNow: boolean;
    outMinutesToday: number;
  }) => void;
  updateSession: (id: string, updates: Partial<Session>) => void;
  deleteSession: (id: string) => void;
  addSession: (session: Session) => void;
  resetData: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  reminderMinutes: 45,
  dailyGoalMinutes: 22 * 60, // 22 hours
  use24HourClock: false,
  darkMode: 'system',
  language: 'en',
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
      onboardingCompleted: false,
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

      updateSession: (id, updates) => {
        const state = get();
        const undoState = {
          currentState: state.currentState,
          lastTransition: state.lastTransition,
          sessions: [...state.sessions],
          trays: [...state.trays],
        };

        const updatedSessions = state.sessions.map((s) => {
          if (s.id === id) {
            return { ...s, ...updates };
          }
          return s;
        });

        let newLastTransition = state.lastTransition;
        const activeSession = state.sessions.find(s => s.end === undefined);
        if (activeSession && activeSession.id === id && updates.start !== undefined) {
          newLastTransition = updates.start;
        }

        set({
          sessions: updatedSessions,
          lastTransition: newLastTransition,
          undoStack: undoState,
        });
      },

      deleteSession: (id) => {
        const state = get();
        const undoState = {
          currentState: state.currentState,
          lastTransition: state.lastTransition,
          sessions: [...state.sessions],
          trays: [...state.trays],
        };

        const updatedSessions = state.sessions.filter((s) => s.id !== id);

        let newCurrentState = state.currentState;
        let newLastTransition = state.lastTransition;
        const sessionToDelete = state.sessions.find(s => s.id === id);
        if (sessionToDelete && sessionToDelete.end === undefined) {
          newCurrentState = 'out';
          newLastTransition = Date.now();
        }

        set({
          sessions: updatedSessions,
          currentState: newCurrentState,
          lastTransition: newLastTransition,
          undoStack: undoState,
        });
      },

      addSession: (session) => {
        const state = get();
        const undoState = {
          currentState: state.currentState,
          lastTransition: state.lastTransition,
          sessions: [...state.sessions],
          trays: [...state.trays],
        };

        set({
          sessions: [...state.sessions, session],
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

      completeOnboarding: (params) => {
        const { currentTrayNum, startedAtMs, isWearingNow, outMinutesToday } = params;
        const now = Date.now();

        const generatedTrays: Tray[] = [];
        const generatedSessions: Session[] = [];

        // 1. Generate previous trays (each 7 days duration before the startedAtMs)
        const trayDurationMs = 7 * 24 * 60 * 60 * 1000;
        for (let i = 1; i < currentTrayNum; i++) {
          const started = startedAtMs - (currentTrayNum - i) * trayDurationMs;
          const ended = started + trayDurationMs;
          generatedTrays.push({
            id: `tray-${i}-${Math.random().toString(36).substring(2, 5)}`,
            number: i,
            startedAt: started,
            expectedEnd: ended,
          });
        }

        // 2. Generate active current tray
        generatedTrays.push({
          id: `tray-${currentTrayNum}-${Math.random().toString(36).substring(2, 5)}`,
          number: currentTrayNum,
          startedAt: startedAtMs,
          expectedEnd: startedAtMs + trayDurationMs,
        });

        // 3. Generate mock sessions for historical days (prior to today)
        const firstTrayStartMs = generatedTrays[0].startedAt;
        const startOfTodayMs = startOfDay(new Date()).getTime();

        const dayMs = 24 * 60 * 60 * 1000;
        let currentDayStartMs = startOfDay(new Date(firstTrayStartMs)).getTime();

        while (currentDayStartMs < startOfTodayMs) {
          generatedSessions.push({
            id: `session-mock-${currentDayStartMs}-${Math.random().toString(36).substring(2, 5)}`,
            start: currentDayStartMs + 1 * 60 * 60 * 1000,
            end: currentDayStartMs + 23 * 60 * 60 * 1000,
          });
          currentDayStartMs += dayMs;
        }

        // 4. Initialize current state and session for today
        const timeElapsedToday = now - startOfTodayMs;
        const outMsToday = outMinutesToday * 60 * 1000;
        const wornMsToday = Math.max(0, timeElapsedToday - outMsToday);

        if (wornMsToday > 0) {
          // Create a closed session representing the wear time earlier today
          generatedSessions.push({
            id: `session-today-worn-${Math.random().toString(36).substring(2, 5)}`,
            start: startOfTodayMs + 1 * 60 * 60 * 1000, // starts at 1 AM
            end: startOfTodayMs + 1 * 60 * 60 * 1000 + wornMsToday,
          });
        }

        if (isWearingNow) {
          // Currently wearing: create an open session starting now
          generatedSessions.push({
            id: `session-active-${Math.random().toString(36).substring(2, 5)}`,
            start: now,
          });
          set({
            currentState: 'wearing',
            lastTransition: now,
            sessions: generatedSessions,
            trays: generatedTrays,
            onboardingCompleted: true,
            undoStack: null,
          });
        } else {
          // Currently out: set state to out
          set({
            currentState: 'out',
            lastTransition: now,
            sessions: generatedSessions,
            trays: generatedTrays,
            onboardingCompleted: true,
            undoStack: null,
          });
        }
      },

      resetData: () => {
        set({
          currentState: 'out',
          lastTransition: Date.now(),
          sessions: [],
          trays: [getInitialTray()],
          settings: DEFAULT_SETTINGS,
          onboardingCompleted: false,
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
        onboardingCompleted: state.onboardingCompleted,
      }),
    }
  )
);
