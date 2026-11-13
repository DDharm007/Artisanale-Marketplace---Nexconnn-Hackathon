import React from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
  icon?: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/80',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative z-10 flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200',
              isActive
                ? 'text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            )}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-semibold',
                  isActive
                    ? 'bg-brand-100 text-brand-700'
                    : 'bg-slate-200 text-slate-600'
                )}
              >
                {tab.badge}
              </span>
            )}
            {isActive && (
              <div className="absolute inset-0 z-[-1] rounded-lg bg-white shadow-sm ring-1 ring-slate-900/5" />
            )}
          </button>
        );
      })}
    </div>
  );
};
