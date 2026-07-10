import { startOfDay, endOfDay } from 'date-fns';
import type { Session } from '../types';

/**
 * Gets the start and end timestamp of a specific day in local time.
 */
export function getDayRange(date: Date): { startMs: number; endMs: number } {
  return {
    startMs: startOfDay(date).getTime(),
    endMs: endOfDay(date).getTime(),
  };
}

/**
 * Calculates total wear time in milliseconds for a specific day.
 * Correctly handles session overlaps and midnight boundary crossings.
 */
export function calculateDailyWearTime(sessions: Session[], date: Date): number {
  const { startMs, endMs } = getDayRange(date);
  let totalWearMs = 0;
  const now = Date.now();

  for (const session of sessions) {
    const sessionStart = session.start;
    const sessionEnd = session.end ?? now;

    // Check if session has overlap with the selected day
    if (sessionStart > endMs || sessionEnd < startMs) {
      continue;
    }

    const overlapStart = Math.max(sessionStart, startMs);
    const overlapEnd = Math.min(sessionEnd, endMs);

    if (overlapEnd > overlapStart) {
      totalWearMs += overlapEnd - overlapStart;
    }
  }

  return totalWearMs;
}

/**
 * Format milliseconds to hours and minutes.
 */
export function msToHoursAndMinutes(ms: number): { hours: number; minutes: number } {
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
}

/**
 * Format milliseconds to hours, minutes, and seconds (for stopwatch ticks).
 */
export function msToHoursMinutesAndSeconds(ms: number): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
}

/**
 * Generate a friendly display string (e.g. "19h 12m" or "0h 45m").
 */
export function formatDurationString(hours: number, minutes: number): string {
  return `${hours}h ${minutes}m`;
}

/**
 * Formats a timestamp into HH:MM using 12-hour or 24-hour clock.
 */
export function formatTime(timestamp: number, use24HourClock: boolean): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const pad = (num: number) => num.toString().padStart(2, '0');

  if (use24HourClock) {
    return `${pad(hours)}:${pad(minutes)}`;
  } else {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${pad(minutes)} ${period}`;
  }
}
