import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { calculateDailyWearTime, msToHoursAndMinutes } from '../utils/timeCalculations';
import { subDays, format, isSameDay } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { DayDetail } from './DayDetail';

export const History: React.FC = () => {
  const sessions = useStore((state) => state.sessions);
  const settings = useStore((state) => state.settings);
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Generate list of the last 14 days
  const historyDays = Array.from({ length: 14 }).map((_, i) => subDays(new Date(), i));

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
      <div className="w-full mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          History
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Compliance history for the last two weeks.
        </p>
      </div>

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
