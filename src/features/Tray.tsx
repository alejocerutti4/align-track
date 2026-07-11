import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../utils/i18n';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Calendar, Plus, Edit2, Check, X } from 'lucide-react';
import type { Tray as TrayType } from '../types';

const toLocalDateString = (timestamp: number) => {
  const date = new Date(timestamp);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseLocalDateString = (str: string) => {
  const [year, month, day] = str.split('-').map(Number);
  return new Date(year, month - 1, day).getTime();
};

export const Tray: React.FC = () => {
  const trays = useStore((state) => state.trays);
  const nextTray = useStore((state) => state.nextTray);
  const updateTray = useStore((state) => state.updateTray);
  const { t, language } = useTranslation();

  // Re-render check every minute
  const [_tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Editing state
  const [editingTrayId, setEditingTrayId] = useState<string | null>(null);
  const [editNumber, setEditNumber] = useState<number>(1);
  const [editStart, setEditStart] = useState<string>('');
  const [editEnd, setEditEnd] = useState<string>('');

  const currentLocale = language === 'es' ? es : enUS;

  const startEdit = (tray: TrayType) => {
    setEditingTrayId(tray.id);
    setEditNumber(tray.number);
    setEditStart(toLocalDateString(tray.startedAt));
    setEditEnd(toLocalDateString(tray.expectedEnd));
  };

  const handleSave = (id: string) => {
    updateTray(id, {
      number: editNumber,
      startedAt: parseLocalDateString(editStart),
      expectedEnd: parseLocalDateString(editEnd),
    });
    setEditingTrayId(null);
  };

  // Find active tray (last one in list)
  const activeTray = trays[trays.length - 1];

  if (!activeTray) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-6 pb-24 max-w-md mx-auto text-center">
        <span className="text-sm text-zinc-500">{t('noPreviousTrays')}</span>
      </div>
    );
  }

  const now = Date.now();
  const elapsed = now - activeTray.startedAt;
  const duration = activeTray.expectedEnd - activeTray.startedAt;
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (elapsed / duration) * 100)) : 0;
  const daysLeft = Math.max(0, Math.ceil((activeTray.expectedEnd - now) / (1000 * 60 * 60 * 24)));

  const isEditingActive = editingTrayId === activeTray.id;

  return (
    <div className="flex flex-col justify-between min-h-[calc(100vh-4rem)] p-6 pb-24 max-w-md mx-auto animate-fade-in">
      <div className="w-full flex-1">
        {/* Header */}
        <div className="w-full mb-6 mt-4">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {t('trayTrackerTitle')}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {language === 'es' 
              ? 'Monitorea el progreso de tu férula actual y el calendario de cambios.' 
              : 'Track your current tray progress and switch schedule.'}
          </p>
        </div>

        {/* Current Aligner Details Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm flex flex-col gap-5 transition-all">
          {isEditingActive ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  {language === 'es' ? 'Editando Férula Activa' : 'Editing Active Aligner'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(activeTray.id)}
                    className="p-1.5 bg-brand-green/10 hover:bg-brand-green/20 text-brand-green rounded-lg transition cursor-pointer"
                    title={t('save')}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingTrayId(null)}
                    className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 rounded-lg transition cursor-pointer"
                    title={t('cancel')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t('trayNumberLabel')}</label>
                <input
                  type="number"
                  value={editNumber}
                  onChange={(e) => setEditNumber(parseInt(e.target.value) || 1)}
                  className="h-10 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-brand-green text-zinc-800 dark:text-zinc-100 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t('startedLabel')}</label>
                  <input
                    type="date"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    className="h-10 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-brand-green text-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t('endsLabel')}</label>
                  <input
                    type="date"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    className="h-10 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-brand-green text-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    {t('activeAlignerCard')}
                    <button
                      onClick={() => startEdit(activeTray)}
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition cursor-pointer"
                      title={t('edit')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                  <span className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1">
                    {t('trayNumberLabel')} {activeTray.number}
                  </span>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    {language === 'es' ? 'Tiempo Restante' : 'Time Remaining'}
                  </span>
                  <span className="text-sm font-bold text-brand-green mt-2 bg-brand-green/10 dark:bg-brand-green/20 px-2.5 py-1 rounded-full">
                    {language === 'es' 
                      ? `${daysLeft} ${daysLeft === 1 ? 'día' : 'días'} restantes` 
                      : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`}
                  </span>
                </div>
              </div>

              {/* Dates layout */}
              <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-5">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-zinc-400 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t('startedLabel')}</span>
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">
                      {format(new Date(activeTray.startedAt), 'MMMM d, yyyy', { locale: currentLocale })}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-zinc-400 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t('expectedEndDate')}</span>
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">
                      {format(new Date(activeTray.expectedEnd), 'MMMM d, yyyy', { locale: currentLocale })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Section */}
              <div className="space-y-2.5 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-zinc-500 dark:text-zinc-400">{t('progressLabel')}</span>
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
            </>
          )}
        </div>

        {/* Previous Trays Log list */}
        {trays.length > 1 && (
          <div className="mt-8">
            <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
              {t('previousTrays')}
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
              {trays.slice(0, -1).reverse().map((tray) => {
                const isEditingPrevious = editingTrayId === tray.id;
                return (
                  <div 
                    key={tray.id} 
                    className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl"
                  >
                    {isEditingPrevious ? (
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex justify-between items-center gap-2">
                          <input
                            type="number"
                            value={editNumber}
                            onChange={(e) => setEditNumber(parseInt(e.target.value) || 1)}
                            className="w-20 h-8 px-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-xs font-bold focus:outline-none text-zinc-800 dark:text-zinc-100"
                          />
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleSave(tray.id)}
                              className="p-1 bg-brand-green/10 text-brand-green rounded hover:bg-brand-green/20 transition cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingTrayId(null)}
                              className="p-1 bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded hover:bg-zinc-300 transition cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={editStart}
                            onChange={(e) => setEditStart(e.target.value)}
                            className="h-8 px-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-[10px] text-zinc-800 dark:text-zinc-100"
                          />
                          <input
                            type="date"
                            value={editEnd}
                            onChange={(e) => setEditEnd(e.target.value)}
                            className="h-8 px-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-[10px] text-zinc-800 dark:text-zinc-100"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('trayNumberLabel')} {tray.number}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                            {format(new Date(tray.startedAt), 'MMM d', { locale: currentLocale })} – {format(new Date(tray.expectedEnd), 'MMM d', { locale: currentLocale })}
                          </span>
                          <button
                            onClick={() => startEdit(tray)}
                            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition cursor-pointer"
                            title={t('edit')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
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
          {t('addNextTray')}
        </button>
      </div>
    </div>
  );
};

export default Tray;
