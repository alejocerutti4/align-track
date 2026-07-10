import React, { useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import { Navigation } from './components/Navigation';
import { Home } from './features/Home';
import { History } from './features/History';
import { Tray } from './features/Tray';
import { Settings } from './features/Settings';
import { UndoToast } from './components/UndoToast';
import { NotificationManager } from './components/NotificationManager';
import { useRegisterSW } from 'virtual:pwa-register/react';
import './App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'tray' | 'settings'>('home');
  const darkModeSetting = useStore((state) => state.settings.darkMode);

  // Register PWA service worker with automatic reload prompts
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {
      console.log('Service worker registered successfully');
    },
    onRegisterError(error) {
      console.error('Service worker registration failed:', error);
    },
  });

  // Sync Appearance Theme class with DOM
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark =
        darkModeSetting === 'dark' ||
        (darkModeSetting === 'system' && mediaQuery.matches);

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    // Set up system theme change listener if mode is 'system'
    if (darkModeSetting === 'system') {
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [darkModeSetting]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <Home />;
      case 'history':
        return <History />;
      case 'tray':
        return <Tray />;
      case 'settings':
        return <Settings />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg-light dark:bg-brand-bg-dark transition-colors duration-200">
      {/* PWA Update Banner */}
      {needRefresh && (
        <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-lg flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">New version available</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Tap reload to update the app.</span>
          </div>
          <button
            onClick={() => updateServiceWorker(true)}
            className="bg-brand-green hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition active:scale-95"
          >
            Reload
          </button>
        </div>
      )}

      {/* Active Tab View */}
      <main className="w-full">
        {renderActiveTab()}
      </main>

      {/* Persistent global widgets */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <UndoToast />
      <NotificationManager />
    </div>
  );
};

export default App;
