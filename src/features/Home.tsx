import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../utils/i18n';
import { calculateDailyWearTime, msToHoursAndMinutes, msToHoursMinutesAndSeconds } from '../utils/timeCalculations';
import { Play, Square } from 'lucide-react';
import { startOfDay } from 'date-fns';

export const Home: React.FC = () => {
  const currentState = useStore((state) => state.currentState);
  const lastTransition = useStore((state) => state.lastTransition);
  const sessions = useStore((state) => state.sessions);
  const settings = useStore((state) => state.settings);
  const putIn = useStore((state) => state.putIn);
  const takeOut = useStore((state) => state.takeOut);
  const { t, language } = useTranslation();

  // Trigger re-render every second to update stopwatch and daily totals
  const [_tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const now = Date.now();
  const today = new Date();

  // Total wear time today (in ms)
  const todayWearMs = calculateDailyWearTime(sessions, today);
  const goalMs = settings.dailyGoalMinutes * 60 * 1000;
  const remainingMs = Math.max(0, goalMs - todayWearMs);

  const { hours: wornHours, minutes: wornMinutes } = msToHoursAndMinutes(todayWearMs);
  const { hours: remHours, minutes: remMinutes } = msToHoursAndMinutes(remainingMs);

  const compliance = goalMs > 0 ? (todayWearMs / goalMs) * 100 : 0;

  // Out Today calculations
  const startOfTodayMs = startOfDay(today).getTime();
  const timeElapsedToday = now - startOfTodayMs;
  const outMsToday = Math.max(0, timeElapsedToday - todayWearMs);
  const { hours: outHours, minutes: outMinutes } = msToHoursAndMinutes(outMsToday);

  // Out Remaining Budget calculations (Total Budget = 24h - Daily Goal)
  const outBudgetMs = Math.max(0, (24 * 60 - settings.dailyGoalMinutes) * 60 * 1000);
  const outRemainingMs = outBudgetMs - outMsToday;
  const isOutOverBudget = outRemainingMs < 0;
  
  const { hours: outLeftHours, minutes: outLeftMinutes } = msToHoursAndMinutes(Math.abs(outRemainingMs));

  // Active duration (since last state change)
  const elapsedMs = now - lastTransition;
  const { hours: elHours, minutes: elMinutes, seconds: elSeconds } = msToHoursMinutesAndSeconds(elapsedMs);

  const formatStopwatch = (h: number, m: number, s: number) => {
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const getFormatDurationString = (h: number, m: number) => {
    const hrSuffix = t('hrs');
    const minSuffix = t('mins');
    if (h === 0 && m === 0) return `0 ${minSuffix}`;
    if (h === 0) return `${m}${minSuffix}`;
    if (m === 0) return `${h}${hrSuffix}`;
    return `${h}${hrSuffix} ${m}${minSuffix}`;
  };

  // SVG Circular Ring parameters
  const radius = 85;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  // Cap visual compliance representation at 100% for the ring fill
  const visualCompliance = Math.min(100, compliance);
  const strokeDashoffset = circumference - (visualCompliance / 100) * circumference;

  const isWearing = currentState === 'wearing';

  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-4rem)] p-6 pb-24 max-w-md mx-auto animate-fade-in">
      {/* Top Header info */}
      <div className="w-full text-center mt-4 mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {t('homeTitle')}
        </h1>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium tracking-wider uppercase mt-1">
          {today.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
      </div>

      {/* Radial Ring Card */}
      <div className="relative flex items-center justify-center w-72 h-72 my-4">
        {/* Breathing ambient shadow circle */}
        <div 
          className={`absolute inset-0 rounded-full bg-transparent transition-all duration-300 ${
            isWearing ? 'breathe-green' : 'breathe-orange'
          }`} 
        />
        
        {/* SVG Ring */}
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="144"
            cy="144"
            r={radius}
            className="stroke-zinc-200 dark:stroke-zinc-800 fill-transparent"
            strokeWidth={stroke}
          />
          {/* Foreground circle */}
          <circle
            cx="144"
            cy="144"
            r={radius}
            className={`fill-transparent transition-all duration-500 ease-out ${
              isWearing ? 'stroke-brand-green' : 'stroke-brand-orange'
            }`}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Stopwatch Content Inside Circle */}
        <div className="absolute flex flex-col items-center text-center">
          {/* State Text */}
          <span 
            className={`text-xs font-bold tracking-widest uppercase mb-1 flex items-center gap-1.5 ${
              isWearing ? 'text-brand-green' : 'text-brand-orange'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isWearing ? 'bg-brand-green animate-pulse' : 'bg-brand-orange'}`} />
            {isWearing ? t('statusWearing') : t('statusOut')}
          </span>

          {/* Stopwatch Ticks */}
          <span className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-50 tabular-nums">
            {formatStopwatch(elHours, elMinutes, elSeconds)}
          </span>

          {/* Helper label */}
          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 mt-2 uppercase tracking-wide">
            {isWearing ? t('sessionCurrent') : t('sessionTimeOut')}
          </span>
        </div>
      </div>

      {/* Target & Stats Dashboard - 2x2 grid for cleaner representation */}
      <div className="grid grid-cols-2 gap-3 w-full my-4">
        {/* Worn Today */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm flex flex-col justify-center transition-colors">
          <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t('wornToday')}</span>
          <span className="text-base font-extrabold text-zinc-800 dark:text-zinc-100 mt-0.5 tabular-nums">
            {getFormatDurationString(wornHours, wornMinutes)}
          </span>
        </div>

        {/* Goal Progress */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm flex flex-col justify-center transition-colors">
          <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t('goalRemaining')}</span>
          <span className={`text-base font-extrabold mt-0.5 tabular-nums ${remainingMs === 0 ? 'text-brand-green' : 'text-zinc-800 dark:text-zinc-100'}`}>
            {remainingMs === 0 ? t('done') : getFormatDurationString(remHours, remMinutes)}
          </span>
        </div>

        {/* Out Today */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm flex flex-col justify-center transition-colors">
          <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t('outToday')}</span>
          <span className="text-base font-extrabold text-zinc-800 dark:text-zinc-100 mt-0.5 tabular-nums">
            {getFormatDurationString(outHours, outMinutes)}
          </span>
        </div>

        {/* Out Budget Left */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm flex flex-col justify-center transition-colors">
          <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t('outBudgetLeft')}</span>
          <span className={`text-base font-extrabold mt-0.5 tabular-nums ${isOutOverBudget ? 'text-brand-orange' : 'text-brand-green'}`}>
            {isOutOverBudget 
              ? `${getFormatDurationString(outLeftHours, outLeftMinutes)} ${t('over')}` 
              : `${getFormatDurationString(outLeftHours, outLeftMinutes)} ${t('left')}`}
          </span>
        </div>
      </div>

      {/* Huge Action Button */}
      <div className="w-full mt-4">
        {isWearing ? (
          <button
            onClick={takeOut}
            className="flex items-center justify-center gap-2.5 w-full h-14 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-semibold rounded-full shadow-lg hover:bg-brand-orange hover:text-white dark:hover:bg-brand-orange dark:hover:text-white transition-all active:scale-[0.97] cursor-pointer"
          >
            <Square className="w-4 h-4 fill-current stroke-none" />
            {t('actionTakeOut')}
          </button>
        ) : (
          <button
            onClick={putIn}
            className="flex items-center justify-center gap-2.5 w-full h-14 bg-brand-green text-white font-semibold rounded-full shadow-lg hover:bg-emerald-600 transition-all active:scale-[0.97] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            {t('actionPutIn')}
          </button>
        )}
      </div>
    </div>
  );
};

export default Home;
