import React from 'react';
import { Home, History, Layers, Settings } from 'lucide-react';

import { useTranslation } from '../utils/i18n';

interface NavigationProps {
  activeTab: 'home' | 'history' | 'tray' | 'settings';
  setActiveTab: (tab: 'home' | 'history' | 'tray' | 'settings') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useTranslation();

  const tabs = [
    { id: 'home', label: t('tabHome'), icon: Home },
    { id: 'history', label: t('tabHistory'), icon: History },
    { id: 'tray', label: t('tabTray'), icon: Layers },
    { id: 'settings', label: t('tabSettings'), icon: Settings },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white/80 backdrop-blur-lg border-zinc-200/80 px-6 pb-safe-bottom dark:bg-zinc-900/80 dark:border-zinc-800/80 transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-brand-green dark:text-brand-green'
                  : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`}
            >
              <Icon className="h-5 w-5 stroke-[2]" />
              <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
