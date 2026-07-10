import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { Calendar, Plus } from 'lucide-react';

export const Tray: React.FC = () => {
  const trays = useStore((state) => state.trays);
  const nextTray = useStore((state) => state.nextTray);

  // Trigger re-render to update progress bar dynamically
  const [_tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000); // Check progress every minute
    return () => clearInterval(timer);
  }, []);

  // Find active tray (last one in list)
  const activeTray = trays[trays.length - 1];

  if (!activeTray) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-6 pb-24 max-w-md mx-auto text-center">
        <span className="text-sm text-zinc-500">No active tray tracker found.</span>
      </div>
    );
  }

  const now = Date.now();
  const elapsed = now - activeTray.startedAt;
  const duration = activeTray.expectedEnd - activeTray.startedAt;
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (elapsed / duration) * 100)) : 0;
  const daysLeft = Math.max(0, Math.ceil((activeTray.expectedEnd - now) / (1000 * 60 * 60 * 24)));

  return (
    <div className="flex flex-col justify-between min-h-[calc(100vh-4rem)] p-6 pb-24 max-w-md mx-auto animate-fade-in">
      <div className="w-full flex-1">
        {/* Header */}
        <div className="w-full mb-6 mt-4">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Tray Tracker
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track your current tray progress and switch schedule.
          </p>
        </div>

        {/* Current Aligner Details Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm flex flex-col gap-6 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Current Aligner</span>
              <span className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1">
                Tray {activeTray.number}
              </span>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Time Remaining</span>
              <span className="text-sm font-bold text-brand-green mt-2 bg-brand-green/10 dark:bg-brand-green/20 px-2.5 py-1 rounded-full">
                {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
              </span>
            </div>
          </div>

          {/* Dates layout */}
          <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-5">
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-zinc-400 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Started</span>
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">
                  {format(new Date(activeTray.startedAt), 'MMMM d, yyyy')}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-zinc-400 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Expected End</span>
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">
                  {format(new Date(activeTray.expectedEnd), 'MMMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-2.5 pt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-zinc-500 dark:text-zinc-400">Tray Progress</span>
              <span className="font-bold text-zinc-700 dark:text-zinc-200">{Math.round(progressPercent)}%</span>
            </div>
            {/* Elegant Progress bar wrapper */}
            <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-green rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Previous Trays Log list */}
        {trays.length > 1 && (
          <div className="mt-8">
            <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
              Previous Trays
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
              {trays.slice(0, -1).reverse().map((tray) => (
                <div 
                  key={tray.id} 
                  className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl"
                >
                  <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Tray {tray.number}</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                    {format(new Date(tray.startedAt), 'MMM d')} – {format(new Date(tray.expectedEnd), 'MMM d')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Next Tray Button */}
      <div className="w-full mt-6">
        <button
          onClick={nextTray}
          className="flex items-center justify-center gap-2 w-full h-14 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-semibold rounded-full shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-[0.97] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Next Tray
        </button>
      </div>
    </div>
  );
};
export default Tray;
