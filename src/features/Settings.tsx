import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../utils/i18n';
import { Download, Upload, RotateCcw, AlertTriangle, CheckCircle, Bell, ChevronDown, Check } from 'lucide-react';

interface CustomSelectProps<T> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

function CustomSelect<T extends string | number>({ value, options, onChange }: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-green transition-colors cursor-pointer text-left"
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown className={`w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-fade-in">
          <div className="py-1 max-h-60 overflow-y-auto no-scrollbar">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full h-11 px-3.5 text-sm transition-colors text-left cursor-pointer ${
                    isSelected
                      ? 'bg-brand-green/10 text-brand-green font-semibold dark:bg-brand-green/20'
                      : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-950'
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-brand-green" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export const Settings: React.FC = () => {
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);
  const resetData = useStore((state) => state.resetData);
  const importData = useStore((state) => state.importData);
  const fullStoreState = useStore((state) => state);
  const { t, language } = useTranslation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [resetConfirm, setResetConfirm] = useState(false);

  // Request Notification Permissions helper
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    const res = await Notification.requestPermission();
    setNotificationPermission(res);
  };

  // Export state as JSON file
  const handleExport = () => {
    const backupData = {
      currentState: fullStoreState.currentState,
      lastTransition: fullStoreState.lastTransition,
      sessions: fullStoreState.sessions,
      trays: fullStoreState.trays,
      settings: fullStoreState.settings,
      onboardingCompleted: fullStoreState.onboardingCompleted,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aligntrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle JSON file upload
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const success = importData(json);
        if (success) {
          setImportStatus('success');
          setTimeout(() => setImportStatus('idle'), 3000);
        } else {
          setImportStatus('error');
          setTimeout(() => setImportStatus('idle'), 3000);
        }
      } catch (err) {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
    // Clear value to allow selecting same file again
    if (e.target) e.target.value = '';
  };

  const handleReset = () => {
    resetData();
    setResetConfirm(false);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] p-6 pb-24 max-w-md mx-auto animate-fade-in">
      {/* Header */}
      <div className="w-full mb-6 mt-4">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {t('settingsTitle')}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {language === 'es' 
            ? 'Ajusta tus preferencias, maneja copias de seguridad y notificaciones.'
            : 'Adjust preferences, manage data backups, and notifications.'}
        </p>
      </div>

      <div className="space-y-6 w-full">
        {/* Daily Goal & Reminders Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-5 transition-colors">
          <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            {language === 'es' ? 'Meta y Monitoreo' : 'Goal & Tracking'}
          </h2>

          {/* Daily Goal Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {t('settingsDailyGoal')}
            </label>
            <CustomSelect
              value={settings.dailyGoalMinutes}
              onChange={(val) => updateSettings({ dailyGoalMinutes: val })}
              options={[
                { value: 20 * 60, label: language === 'es' ? '20 horas' : '20 hours' },
                { value: 21 * 60, label: language === 'es' ? '21 horas' : '21 hours' },
                { value: 22 * 60, label: language === 'es' ? '22 horas (Recomendado)' : '22 hours (Recommended)' },
                { value: 23 * 60, label: language === 'es' ? '23 horas' : '23 hours' },
              ]}
            />
          </div>

          {/* Reminders Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {t('settingsReminderInterval')}
            </label>
            <CustomSelect
              value={settings.reminderMinutes}
              onChange={(val) => updateSettings({ reminderMinutes: val })}
              options={[
                { value: 15, label: language === 'es' ? '15 minutos' : '15 minutes' },
                { value: 30, label: language === 'es' ? '30 minutos' : '30 minutes' },
                { value: 45, label: language === 'es' ? '45 minutos' : '45 minutes' },
                { value: 60, label: language === 'es' ? '60 minutos' : '60 minutes' },
              ]}
            />
          </div>

          {/* Clock format */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t('settings24Hour')}</span>
            <button
              onClick={() => updateSettings({ use24HourClock: !settings.use24HourClock })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.use24HourClock ? 'bg-brand-green' : 'bg-zinc-200 dark:bg-zinc-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.use24HourClock ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Display Preferences */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-5 transition-colors">
          <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            {language === 'es' ? 'Preferencias' : 'Preferences'}
          </h2>

          {/* Language Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {t('settingsLanguage')}
            </label>
            <CustomSelect
              value={settings.language}
              onChange={(val) => updateSettings({ language: val })}
              options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Español' },
              ]}
            />
          </div>

          {/* Dark Mode toggle */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {t('settingsAppearance')}
            </label>
            <div className="grid grid-cols-3 gap-2 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl">
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => updateSettings({ darkMode: mode })}
                  className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-all active:scale-[0.98] ${
                    settings.darkMode === mode
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {mode === 'light' 
                    ? t('settingsAppearanceLight') 
                    : mode === 'dark' 
                      ? t('settingsAppearanceDark') 
                      : t('settingsAppearanceSystem')}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications Permission prompt */}
          {'Notification' in window && (
            <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-2">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-zinc-400" /> {language === 'es' ? 'Notificaciones' : 'Notifications'}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                  {notificationPermission === 'granted' 
                    ? (language === 'es' ? 'Permitido' : 'Allowed') 
                    : notificationPermission === 'denied' 
                      ? (language === 'es' ? 'Bloqueado' : 'Blocked') 
                      : (language === 'es' ? 'No Solicitado' : 'Not Requested')}
                </span>
              </div>
              {notificationPermission !== 'granted' && (
                <button
                  onClick={requestNotificationPermission}
                  className="text-xs font-bold text-brand-green bg-brand-green/10 hover:bg-brand-green/20 dark:bg-brand-green/20 px-3 py-1.5 rounded-lg active:scale-95 transition cursor-pointer"
                >
                  {language === 'es' ? 'Activar' : 'Enable'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Backup & Administration Options */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4 transition-colors">
          <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            {t('settingsDataManagement')}
          </h2>

          <div className="flex flex-col gap-2">
            {/* Export data */}
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 w-full h-11 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950 transition active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {t('settingsExport')}
            </button>

            {/* Import file handler */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 w-full h-11 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950 transition active:scale-[0.98] cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              {t('settingsImport')}
            </button>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleImport}
              className="hidden"
            />
          </div>

          {/* Import message notifications */}
          {importStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-brand-green/10 text-brand-green rounded-xl text-xs font-semibold">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {t('settingsToastImportSuccess')}
            </div>
          )}
          {importStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-500 rounded-xl text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {t('settingsToastImportError')}
            </div>
          )}
        </div>

        {/* Reset Area */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-red-500 uppercase tracking-wider">
            {language === 'es' ? 'Zona Peligrosa' : 'Danger Zone'}
          </h2>
          {!resetConfirm ? (
            <button
              onClick={() => setResetConfirm(true)}
              className="flex items-center justify-center gap-2 w-full h-11 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold shadow transition active:scale-[0.98] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              {t('settingsReset')}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                {t('settingsResetSub')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setResetConfirm(false)}
                  className="h-10 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950 transition cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleReset}
                  className="h-10 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  {t('settingsResetBtn')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
