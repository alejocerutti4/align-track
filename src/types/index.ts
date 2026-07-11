export interface Session {
  id: string;
  start: number; // Unix timestamp in ms
  end?: number;  // Unix timestamp in ms, undefined means open session
}

export interface Tray {
  id: string;
  number: number;
  startedAt: number;  // Unix timestamp in ms
  expectedEnd: number; // Unix timestamp in ms
}

export interface Settings {
  reminderMinutes: number;
  dailyGoalMinutes: number;
  use24HourClock: boolean;
  darkMode: 'system' | 'light' | 'dark';
  language: 'en' | 'es';
}

export interface AppState {
  currentState: 'wearing' | 'out';
  lastTransition: number; // Unix timestamp in ms of last state change
  sessions: Session[];
  trays: Tray[];
  settings: Settings;
  onboardingCompleted: boolean;
  undoStack: Omit<AppState, 'undoStack' | 'settings' | 'onboardingCompleted'> | null; // For 10s undo capability
}
