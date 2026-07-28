import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../utils/i18n';
import { getDayRange, calculateDailyWearTime, msToHoursAndMinutes, formatTime } from '../utils/timeCalculations';
import { ArrowLeft, Clock, Plus, Trash2, Edit2, Check, X, Calendar } from 'lucide-react';
import { format, isSameDay, subDays } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import type { Session } from '../types';

interface DayDetailProps {
  date: Date;
  onBack: () => void;
}

const formatTimestampToTimeInput = (timestamp: number) => {
  const d = new Date(timestamp);
  const hrs = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hrs}:${mins}`;
};

const parseTimeInputToTimestamp = (timeStr: string, baseDate: Date) => {
  const [hrs, mins] = timeStr.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(hrs, mins, 0, 0);
  return d.getTime();
};

const updateTimeOnTimestamp = (originalTimestamp: number, timeStr: string) => {
  const [hrs, mins] = timeStr.split(':').map(Number);
  const d = new Date(originalTimestamp);
  d.setHours(hrs, mins, 0, 0);
  return d.getTime();
};

export const DayDetail: React.FC<DayDetailProps> = ({ date, onBack }) => {
  const sessions = useStore((state) => state.sessions);
  const settings = useStore((state) => state.settings);
  const updateSession = useStore((state) => state.updateSession);
  const deleteSession = useStore((state) => state.deleteSession);
  const addSession = useStore((state) => state.addSession);
  
  const { t, language } = useTranslation();

  const { startMs, endMs } = getDayRange(date);

  // Extract all sessions occurring on this day (started, ended, or covering)
  const daySessions = sessions.filter((session) => {
    if (session.start >= startMs && session.start <= endMs) return true;
    if (session.end && session.end >= startMs && session.end <= endMs) return true;
    if (session.start < startMs && (session.end === undefined || session.end > endMs)) return true;
    return false;
  }).sort((a, b) => a.start - b.start);

  // Add session state
  const [isAdding, setIsAdding] = useState(false);
  const [newStart, setNewStart] = useState('08:00');
  const [newEnd, setNewEnd] = useState('12:00');
  const [newIsStillWearing, setNewIsStillWearing] = useState(false);

  // Edit session state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editIsStillWearing, setEditIsStillWearing] = useState(false);

  // Statistics
  const todayWearMs = calculateDailyWearTime(sessions, date);
  const goalMs = settings.dailyGoalMinutes * 60 * 1000;
  const compliance = goalMs > 0 ? Math.round((todayWearMs / goalMs) * 100) : 0;

  // Locale object
  const currentLocale = language === 'es' ? es : enUS;

  // Title label
  let dateTitle = format(date, 'EEEE, MMMM d', { locale: currentLocale });
  const isToday = isSameDay(date, new Date());
  const isYesterday = isSameDay(date, subDays(new Date(), 1));
  if (isToday) dateTitle = t('today');
  else if (isYesterday) dateTitle = t('yesterday');

  const getFormatDurationString = (durationMs: number) => {
    const { hours: h, minutes: m } = msToHoursAndMinutes(durationMs);
    const hrSuffix = t('hrs');
    const minSuffix = t('mins');
    if (h === 0 && m === 0) return `0 ${minSuffix}`;
    if (h === 0) return `${m}${minSuffix}`;
    if (m === 0) return `${h}${hrSuffix}`;
    return `${h}${hrSuffix} ${m}${minSuffix}`;
  };

  const formatEventTime = (timestamp: number, baseDate: Date, use24h: boolean, locale: any) => {
    const isSame = isSameDay(new Date(timestamp), baseDate);
    const timeFormatted = formatTime(timestamp, use24h);
    if (isSame) {
      return timeFormatted;
    }
    return `${format(new Date(timestamp), 'MMM d', { locale })} ${timeFormatted}`;
  };

  const handleStartEdit = (session: Session) => {
    setEditingId(session.id);
    setEditStart(formatTimestampToTimeInput(session.start));
    setEditEnd(session.end ? formatTimestampToTimeInput(session.end) : '12:00');
    setEditIsStillWearing(session.end === undefined);
  };

  const handleSaveEdit = (id: string, originalSession: Session) => {
    const startMs = updateTimeOnTimestamp(originalSession.start, editStart);
    let endMs: number | undefined = undefined;
    if (!editIsStillWearing) {
      const baseEnd = originalSession.end || originalSession.start;
      endMs = updateTimeOnTimestamp(baseEnd, editEnd);
      if (endMs <= startMs) {
        endMs = endMs + 24 * 60 * 60 * 1000; // Assume wrap around to next day
      }
    }

    updateSession(id, {
      start: startMs,
      end: endMs,
    });
    setEditingId(null);
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    const startTimestamp = parseTimeInputToTimestamp(newStart, date);
    let endTimestamp: number | undefined = undefined;
    
    if (!newIsStillWearing) {
      endTimestamp = parseTimeInputToTimestamp(newEnd, date);
      if (endTimestamp <= startTimestamp) {
        endTimestamp = endTimestamp + 24 * 60 * 60 * 1000;
      }
    }

    addSession({
      id: `session-manual-${Math.random().toString(36).substring(2, 9)}`,
      start: startTimestamp,
      end: endTimestamp,
    });
    setIsAdding(false);
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
        <div className="flex-1">
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
            {getFormatDurationString(todayWearMs)}
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {t('dayDetailSessions')}
          </h2>
          {!isAdding && (
            <button
              onClick={() => {
                setIsAdding(true);
                setNewStart(formatTimestampToTimeInput(Date.now()));
                setNewEnd(formatTimestampToTimeInput(Date.now() + 60 * 60 * 1000));
                setNewIsStillWearing(false);
              }}
              className="text-xs font-bold text-brand-green bg-brand-green/10 hover:bg-brand-green/20 dark:bg-brand-green/20 px-2.5 py-1 rounded-lg active:scale-95 transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> {t('dayDetailAddSession')}
            </button>
          )}
        </div>

        {/* Add Session Form */}
        {isAdding && (
          <form onSubmit={handleAddSession} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm mb-4 space-y-4 animate-fade-in transition-colors">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-brand-green" /> {t('dayDetailAddSession')}
              </span>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="p-1.5 bg-brand-green/10 hover:bg-brand-green/20 text-brand-green rounded-lg transition cursor-pointer"
                  title={t('save')}
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 rounded-lg transition cursor-pointer"
                  title={t('cancel')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t('dayDetailPutInTime')}</label>
                <input
                  type="time"
                  required
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="h-10 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-brand-green text-zinc-800 dark:text-zinc-100 font-bold"
                />
              </div>

              {!newIsStillWearing && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t('dayDetailTookOutTime')}</label>
                  <input
                    type="time"
                    required
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="h-10 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-brand-green text-zinc-800 dark:text-zinc-100 font-bold"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t('dayDetailStillWearing')}</span>
              <button
                type="button"
                onClick={() => setNewIsStillWearing(!newIsStillWearing)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  newIsStillWearing ? 'bg-brand-green' : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    newIsStillWearing ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </form>
        )}

        {/* Sessions list */}
        {daySessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 transition-colors">
            <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">{t('dayDetailNoData')}</span>
          </div>
        ) : (
          <div className="space-y-3">
            {daySessions.map((session) => {
              const isEditing = editingId === session.id;
              const durationMs = session.end ? session.end - session.start : Date.now() - session.start;

              return (
                <div 
                  key={session.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm transition-all flex flex-col gap-3 transition-colors"
                >
                  {isEditing ? (
                    <div className="space-y-4 w-full">
                      <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                          {language === 'es' ? 'Editar Sesión' : 'Edit Session'}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(session.id, session)}
                            className="p-1.5 bg-brand-green/10 hover:bg-brand-green/20 text-brand-green rounded-lg transition cursor-pointer"
                            title={t('save')}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 rounded-lg transition cursor-pointer"
                            title={t('cancel')}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t('dayDetailPutInTime')}</label>
                          <input
                            type="time"
                            value={editStart}
                            onChange={(e) => setEditStart(e.target.value)}
                            className="h-10 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-brand-green text-zinc-800 dark:text-zinc-100 font-bold"
                          />
                        </div>

                        {!editIsStillWearing && (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t('dayDetailTookOutTime')}</label>
                            <input
                              type="time"
                              value={editEnd}
                              onChange={(e) => setEditEnd(e.target.value)}
                              className="h-10 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-brand-green text-zinc-800 dark:text-zinc-100 font-bold"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t('dayDetailStillWearing')}</span>
                        <button
                          type="button"
                          onClick={() => setEditIsStillWearing(!editIsStillWearing)}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            editIsStillWearing ? 'bg-brand-green' : 'bg-zinc-200 dark:bg-zinc-800'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              editIsStillWearing ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      {/* Left: Time blocks */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-brand-green" />
                          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                            {formatEventTime(session.start, date, settings.use24HourClock, currentLocale)}
                          </span>
                          <span className="text-xs text-zinc-400">—</span>
                          {session.end ? (
                            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                              {formatEventTime(session.end, date, settings.use24HourClock, currentLocale)}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-md">
                              {t('dayDetailStillWearing')}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">
                          {t('dayDetailWornDuration')}: <span className="text-zinc-600 dark:text-zinc-300 font-mono font-bold">{getFormatDurationString(durationMs)}</span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(session)}
                          className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-xl transition cursor-pointer"
                          title={t('edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteSession(session.id)}
                          className="p-2 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/5 rounded-xl transition cursor-pointer"
                          title={language === 'es' ? 'Eliminar' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
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
