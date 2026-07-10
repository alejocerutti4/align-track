import React, { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { Download, Upload, RotateCcw, AlertTriangle, CheckCircle, Bell } from 'lucide-react';

export const Settings: React.FC = () => {
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);
  const resetData = useStore((state) => state.resetData);
  const importData = useStore((state) => state.importData);
  const fullStoreState = useStore((state) => state);

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
          Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Adjust preferences, manage data backups, and notifications.
        </p>
      </div>

      <div className="space-y-6 w-full">
        {/* Daily Goal & Reminders Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-5 transition-colors">
          <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Goal & Tracking
          </h2>

          {/* Daily Goal Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Daily Goal
            </label>
            <select
              value={settings.dailyGoalMinutes}
              onChange={(e) => updateSettings({ dailyGoalMinutes: parseInt(e.target.value) })}
              className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-brand-green dark:text-zinc-100"
            >
              <option value={20 * 60}>20 hours</option>
              <option value={21 * 60}>21 hours</option>
              <option value={22 * 60}>22 hours (Recommended)</option>
              <option value={23 * 60}>23 hours</option>
            </select>
          </div>

          {/* Reminders Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Out-of-mouth Reminder Limit
            </label>
            <select
              value={settings.reminderMinutes}
              onChange={(e) => updateSettings({ reminderMinutes: parseInt(e.target.value) })}
              className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-brand-green dark:text-zinc-100"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>

          {/* Clock format */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Use 24-Hour Clock</span>
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
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4 transition-colors">
          <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Preferences
          </h2>

          {/* Dark Mode toggle */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Appearance Theme
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
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications Permission prompt */}
          {'Notification' in window && (
            <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-2">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-zinc-400" /> Notifications
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                  {notificationPermission === 'granted' ? 'Allowed' : notificationPermission === 'denied' ? 'Blocked' : 'Not Requested'}
                </span>
              </div>
              {notificationPermission !== 'granted' && (
                <button
                  onClick={requestNotificationPermission}
                  className="text-xs font-bold text-brand-green bg-brand-green/10 hover:bg-brand-green/20 dark:bg-brand-green/20 px-3 py-1.5 rounded-lg active:scale-95 transition"
                >
                  Enable
                </button>
              )}
            </div>
          )}
        </div>

        {/* Backup & Administration Options */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4 transition-colors">
          <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Backup & Recovery
          </h2>

          <div className="flex flex-col gap-2">
            {/* Export data */}
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 w-full h-11 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950 transition active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Backup/Export Data
            </button>

            {/* Import file handler */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 w-full h-11 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950 transition active:scale-[0.98] cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Restore/Import Backup
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
              Backup imported successfully!
            </div>
          )}
          {importStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-500 rounded-xl text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Failed to import backup. Invalid file content.
            </div>
          )}
        </div>

        {/* Reset Area */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-red-500 uppercase tracking-wider">
            Danger Zone
          </h2>
          {!resetConfirm ? (
            <button
              onClick={() => setResetConfirm(true)}
              className="flex items-center justify-center gap-2 w-full h-11 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold shadow transition active:scale-[0.98] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Application Data
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                Are you absolutely sure? This will delete all your local tracking sessions, trays, and configuration permanently. This cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setResetConfirm(false)}
                  className="h-10 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="h-10 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Confirm Reset
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
