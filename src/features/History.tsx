import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { calculateDailyWearTime, msToHoursAndMinutes } from '../utils/timeCalculations';
import { subDays, format, isSameDay } from 'date-fns';
import { ChevronRight, BarChart2, CheckCircle2, AlertCircle } from 'lucide-react';
import { DayDetail } from './DayDetail';

export const History: React.FC = () => {
  const sessions = useStore((state) => state.sessions);
  const settings = useStore((state) => state.settings);
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Generate list of the last 14 days
  const historyDays = Array.from({ length: 14 }).map((_, i) => subDays(new Date(), i));

  // Generate list of the last 7 days (reverse to show chronological Mon -> Sun order)
  const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), i)).reverse();
  
  // Minimal safe limit is 20 hours
  const MIN_SAFE_MS = 20 * 60 * 60 * 1000;

  // Calculate 7-day stats
  const last7DaysData = last7Days.map((date) => {
    const wearMs = calculateDailyWearTime(sessions, date);
    return {
      date,
      wearMs,
      label: format(date, 'eeeee'), // Single character (e.g. M, T, W)
      isSafe: wearMs >= MIN_SAFE_MS,
    };
  });

  const total7DayWearMs = last7DaysData.reduce((sum, day) => sum + day.wearMs, 0);
  const avgWearMs = total7DayWearMs / 7;
  const { hours: avgHours, minutes: avgMinutes } = msToHoursAndMinutes(avgWearMs);
  const isAvgSafe = avgWearMs >= MIN_SAFE_MS;

  // If a specific day is selected, render the DayDetail view
  if (selectedDate) {
    return (
      <DayDetail 
        date={selectedDate} 
        onBack={() => setSelectedDate(null)} 
      />
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] p-6 pb-24 max-w-md mx-auto animate-fade-in">
      {/* Header */}
      <div className="w-full mb-6 mt-4">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          History & Analytics
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Monitor your compliance statistics and daily metrics.
        </p>
      </div>

      {/* Screen Time Style Chart Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm flex flex-col gap-6 mb-6 transition-colors">
        {/* Mean Summary */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <BarChart2 className="w-3.5 h-3.5" /> 7-Day Average
            </span>
            <span className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1.5 tabular-nums">
              {avgHours}h {avgMinutes}m
            </span>
          </div>

          {/* Compliance Status Badge */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Status</span>
            <div 
              className={`flex items-center gap-1 text-xs font-bold mt-2 px-2.5 py-1 rounded-full ${
                isAvgSafe 
                  ? 'bg-brand-green/10 text-brand-green dark:bg-brand-green/20' 
                  : 'bg-brand-orange/10 text-brand-orange dark:bg-brand-orange/20'
              }`}
            >
              {isAvgSafe ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Safe</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Low Wear</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Minimal Safe indicator description */}
        <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-normal border-t border-zinc-100 dark:border-zinc-800 pt-3">
          Your average is <strong className={isAvgSafe ? 'text-brand-green' : 'text-brand-orange'}>{isAvgSafe ? 'above' : 'below'}</strong> the minimal safe wearing time of <strong>20 hours/day</strong>.
        </p>

        {/* The Bar Chart */}
        <div className="relative h-32 flex items-end justify-between px-3 mt-4 select-none">
          {/* Horizontal Dotted Line for Minimal Safe limit (20h/24h = 83.3% height) */}
          <div 
            className="absolute left-0 right-0 border-t border-dashed border-red-400/50 dark:border-red-500/50 z-10 pointer-events-none"
            style={{ bottom: '83.33%' }}
          >
            <span className="absolute right-0 -top-2.5 bg-white dark:bg-zinc-900 px-1 text-[8px] font-bold text-red-500/70 dark:text-red-400/70 uppercase tracking-wider">
              Min Safe (20h)
            </span>
          </div>

          {/* Horizontal Dotted Line for Daily Goal (from settings, e.g. 22h/24h = 91.6% height) */}
          <div 
            className="absolute left-0 right-0 border-t border-dotted border-zinc-300 dark:border-zinc-700 z-10 pointer-events-none"
            style={{ bottom: `${(settings.dailyGoalMinutes / (24 * 60)) * 100}%` }}
          >
            <span className="absolute left-0 -top-2.5 bg-white dark:bg-zinc-900 px-1 text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Goal
            </span>
          </div>

          {/* Daily Bars */}
          {last7DaysData.map((day) => {
            const dayMs = 24 * 60 * 60 * 1000;
            // Height calculation capped at 100%
            const heightPercent = Math.max(3, Math.min(100, (day.wearMs / dayMs) * 100));

            return (
              <div 
                key={day.date.toISOString()}
                onClick={() => setSelectedDate(day.date)}
                className="flex flex-col items-center flex-1 h-full cursor-pointer group"
              >
                {/* Visual Bar container */}
                <div className="relative w-full flex-1 flex items-end justify-center px-1">
                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full mb-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold py-1 px-1.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 whitespace-nowrap">
                    {Math.floor(day.wearMs / (60 * 60 * 1000))}h {Math.floor((day.wearMs % (60 * 60 * 1000)) / (60 * 1000))}m
                  </div>

                  {/* The Fill bar */}
                  <div 
                    className={`w-5 sm:w-6 rounded-t-md transition-all duration-500 ${
                      day.wearMs === 0
                        ? 'bg-zinc-100 dark:bg-zinc-800'
                        : day.isSafe 
                          ? 'bg-brand-green hover:bg-emerald-600 shadow-sm shadow-brand-green/20' 
                          : 'bg-brand-orange hover:bg-orange-600 shadow-sm shadow-brand-orange/20'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                {/* X-axis Day Label */}
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mt-2.5 select-none uppercase">
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Log list of past days */}
      <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
        Compliance Logs
      </h2>
      
      <div className="space-y-3 w-full">
        {historyDays.map((date) => {
          const todayWearMs = calculateDailyWearTime(sessions, date);
          const goalMs = settings.dailyGoalMinutes * 60 * 1000;
          const { hours, minutes } = msToHoursAndMinutes(todayWearMs);
          const compliance = goalMs > 0 ? Math.round((todayWearMs / goalMs) * 100) : 0;

          let dayLabel = format(date, 'EEEE, MMMM d');
          const isToday = isSameDay(date, new Date());
          const isYesterday = isSameDay(date, subDays(new Date(), 1));

          if (isToday) {
            dayLabel = 'Today';
          } else if (isYesterday) {
            dayLabel = 'Yesterday';
          }

          const hasData = todayWearMs > 0;

          return (
            <button
              key={date.toISOString()}
              onClick={() => setSelectedDate(date)}
              className="flex items-center justify-between w-full p-4 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all active:scale-[0.98] text-left cursor-pointer"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {dayLabel}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {hasData ? `${hours}h ${minutes}m worn` : 'No transitions recorded'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {hasData && (
                  <span 
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      compliance >= 100 
                        ? 'bg-brand-green/10 text-brand-green dark:bg-brand-green/20' 
                        : compliance >= 80
                          ? 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20'
                          : 'bg-brand-orange/10 text-brand-orange dark:bg-brand-orange/20'
                    }`}
                  >
                    {compliance}%
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default History;
