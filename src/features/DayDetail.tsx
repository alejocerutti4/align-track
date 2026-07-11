import React from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../utils/i18n';
import { getDayRange, calculateDailyWearTime, msToHoursAndMinutes, formatTime } from '../utils/timeCalculations';
import { ArrowLeft, ArrowDown, ArrowUp, Clock } from 'lucide-react';
import { format, isSameDay, subDays } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface DayDetailProps {
  date: Date;
  onBack: () => void;
}

export const DayDetail: React.FC<DayDetailProps> = ({ date, onBack }) => {
  const sessions = useStore((state) => state.sessions);
  const settings = useStore((state) => state.settings);
  const { t, language } = useTranslation();

  const { startMs, endMs } = getDayRange(date);

  // Extract all transition events that occurred on this day
  interface TransitionEvent {
    id: string;
    type: 'in' | 'out';
    time: number;
  }

  const events: TransitionEvent[] = [];

  sessions.forEach((session) => {
    // If session started on this day
    if (session.start >= startMs && session.start <= endMs) {
      events.push({
        id: `${session.id}-start`,
        type: 'in',
        time: session.start,
      });
    }
    // If session ended on this day
    if (session.end && session.end >= startMs && session.end <= endMs) {
      events.push({
        id: `${session.id}-end`,
        type: 'out',
        time: session.end,
      });
    }
  });

  // Sort events chronologically
  events.sort((a, b) => a.time - b.time);

  // Statistics
  const todayWearMs = calculateDailyWearTime(sessions, date);
  const goalMs = settings.dailyGoalMinutes * 60 * 1000;
  const { hours, minutes } = msToHoursAndMinutes(todayWearMs);
  const compliance = goalMs > 0 ? Math.round((todayWearMs / goalMs) * 100) : 0;

  // Locale object
  const currentLocale = language === 'es' ? es : enUS;

  // Title label
  let dateTitle = format(date, 'EEEE, MMMM d', { locale: currentLocale });
  const isToday = isSameDay(date, new Date());
  const isYesterday = isSameDay(date, subDays(new Date(), 1));
  if (isToday) dateTitle = t('today');
  else if (isYesterday) dateTitle = t('yesterday');

  const getFormatDurationString = (h: number, m: number) => {
    const hrSuffix = t('hrs');
    const minSuffix = t('mins');
    if (h === 0 && m === 0) return `0 ${minSuffix}`;
    if (h === 0) return `${m}${minSuffix}`;
    if (m === 0) return `${h}${hrSuffix}`;
    return `${h}${hrSuffix} ${m}${minSuffix}`;
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] p-6 pb-24 max-w-md mx-auto animate-fade-in">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6 mt-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition active:scale-95 text-zinc-600 dark:text-zinc-300 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {dateTitle}
          </h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">{t('dayDetailTitle')}</p>
        </div>
      </div>

      {/* Daily Stats Summary */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm mb-6 flex justify-between items-center transition-colors">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t('dayDetailTotalWear')}</span>
          <span className="text-2xl font-bold text-zinc-800 dark:text-zinc-50 mt-1">
            {getFormatDurationString(hours, minutes)}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t('status')}</span>
          <span 
            className={`text-2xl font-bold mt-1 ${
              compliance >= 100 ? 'text-brand-green' : 'text-zinc-800 dark:text-zinc-50'
            }`}
          >
            {compliance}%
          </span>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="flex-1 w-full">
        <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> {t('dayDetailSessions')}
        </h2>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
            <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">{t('dayDetailNoData')}</span>
          </div>
        ) : (
          <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-3 pl-6 space-y-6">
            {events.map((event) => {
              const isIn = event.type === 'in';
              return (
                <div key={event.id} className="relative flex items-center justify-between">
                  {/* Timeline dot */}
                  <span 
                    className={`absolute -left-[31px] flex items-center justify-center w-4 h-4 rounded-full border-2 bg-white dark:bg-zinc-950 ${
                      isIn ? 'border-brand-green' : 'border-brand-orange'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isIn ? 'bg-brand-green' : 'bg-brand-orange'}`} />
                  </span>

                  <div className="flex items-center gap-3">
                    <span 
                      className={`p-1.5 rounded-lg ${
                        isIn ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-orange/10 text-brand-orange'
                      }`}
                    >
                      {isIn ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                    </span>
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {isIn ? t('eventPutIn') : t('eventTookOut')}
                    </span>
                  </div>

                  <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 font-mono">
                    {formatTime(event.time, settings.use24HourClock)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DayDetail;
