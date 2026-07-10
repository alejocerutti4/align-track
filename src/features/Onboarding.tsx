import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Play, Square, Layers, Info } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const completeOnboarding = useStore((state) => state.completeOnboarding);

  // Form states
  const [trayNum, setTrayNum] = useState<number>(1);
  const [trayStartDate, setTrayStartDate] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  });
  const [isWearing, setIsWearing] = useState<boolean>(true);
  const [elapsedHours, setElapsedHours] = useState<number>(1);
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate start timestamp of current tray
    const [year, month, day] = trayStartDate.split('-').map(Number);
    const startedAtMs = new Date(year, month - 1, day).getTime();

    // Calculate elapsed minutes since last transition
    const totalElapsedMinutes = elapsedHours * 60 + elapsedMinutes;

    completeOnboarding({
      currentTrayNum: trayNum,
      startedAtMs,
      isWearingNow: isWearing,
      lastActionMinutesAgo: totalElapsedMinutes,
    });
  };

  return (
    <div className="flex flex-col justify-center min-h-screen p-6 max-w-md mx-auto bg-brand-bg-light dark:bg-brand-bg-dark transition-colors duration-200">
      <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-xl space-y-6 transition-colors">
        {/* Welcome Header */}
        <div className="text-center">
          <div className="w-12 h-12 bg-brand-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Layers className="w-6 h-6 text-brand-green" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome to AlignTrack
          </h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium tracking-wide uppercase mt-1">
            Initial Configuration
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Aligner Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              What tray are you currently on?
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                required
                value={trayNum}
                onChange={(e) => setTrayNum(parseInt(e.target.value) || 1)}
                className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-brand-green text-zinc-800 dark:text-zinc-100 font-bold"
              />
            </div>
          </div>

          {/* Start Date input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              When did you start this tray?
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={trayStartDate}
                onChange={(e) => setTrayStartDate(e.target.value)}
                className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-brand-green text-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Current state selector */}
          <div className="flex flex-col gap-2 pt-1">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Are you wearing your aligners right now?
            </label>
            <div className="grid grid-cols-2 gap-2 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setIsWearing(true)}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all active:scale-[0.98] ${
                  isWearing
                    ? 'bg-white dark:bg-zinc-900 text-brand-green shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Yes, Wearing
              </button>
              <button
                type="button"
                onClick={() => setIsWearing(false)}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all active:scale-[0.98] ${
                  !isWearing
                    ? 'bg-white dark:bg-zinc-900 text-brand-orange shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <Square className="w-3.5 h-3.5 fill-current stroke-none" />
                No, Out
              </button>
            </div>
          </div>

          {/* Time elapsed action selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {isWearing
                ? 'How long ago did you put them in?'
                : 'How long ago did you take them out?'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 h-11 bg-white dark:bg-zinc-900">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={elapsedHours}
                  onChange={(e) => setElapsedHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                  className="w-full text-center bg-transparent text-sm focus:outline-none text-zinc-800 dark:text-zinc-100 font-bold"
                />
                <span className="text-xs text-zinc-400 font-semibold uppercase">hrs</span>
              </div>
              <div className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 h-11 bg-white dark:bg-zinc-900">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={elapsedMinutes}
                  onChange={(e) => setElapsedMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-full text-center bg-transparent text-sm focus:outline-none text-zinc-800 dark:text-zinc-100 font-bold"
                />
                <span className="text-xs text-zinc-400 font-semibold uppercase">mins</span>
              </div>
            </div>
          </div>

          {/* Past compliance note info */}
          <div className="flex gap-2.5 p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-xl text-xs text-blue-600/90 dark:text-blue-400/90">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              We will backfill previous days in your history with exactly <strong>22 hours</strong> of wear time. This ensures your compliance statistics and tracking history are immediately accurate!
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full h-12 bg-brand-green text-white font-semibold rounded-xl shadow-lg hover:bg-emerald-600 transition-all active:scale-[0.97] mt-2 cursor-pointer"
          >
            Start Tracking
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
