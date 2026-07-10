import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Undo2 } from 'lucide-react';

export const UndoToast: React.FC = () => {
  const undoStack = useStore((state) => state.undoStack);
  const undo = useStore((state) => state.undo);
  const clearUndo = useStore((state) => state.clearUndo);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!undoStack) return;

    setProgress(100);
    const duration = 10000; // 10 seconds
    const intervalTime = 100;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const nextProgress = 100 - (currentStep / steps) * 100;
      setProgress(nextProgress);
      if (currentStep >= steps) {
        clearInterval(timer);
        clearUndo();
      }
    }, intervalTime);

    return () => {
      clearInterval(timer);
    };
  }, [undoStack, clearUndo]);

  if (!undoStack) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-sm animate-fade-in">
      <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Action recorded</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Revert using the undo button</span>
        </div>
        <button
          onClick={() => {
            undo();
          }}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-zinc-800 active:scale-95 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Undo2 className="h-3.5 w-3.5 text-inherit" />
          Undo
        </button>
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full bg-brand-green transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
