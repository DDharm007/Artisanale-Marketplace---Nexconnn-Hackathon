import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Headphones, LogOut, ArrowLeft, Globe2 } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { PersistentChatPanel } from '../../features/chat/PersistentChatPanel';

export const SupportLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, switchDemoRole } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Support Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900 text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/shop')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Market
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
              <Headphones className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">
                ConvoCart Human Agent Dispatch Center
              </h2>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
                Active Agent: <strong className="text-slate-200">{user?.displayName || 'Dispatch Specialist'}</strong>
                {user?.preferredLanguage && (
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase text-sky-300">
                    <Globe2 className="h-2.5 w-2.5 inline mr-0.5" />
                    {user.preferredLanguage}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => switchDemoRole('support_agent', 'support@convocart.com')}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              user?.email === 'support@convocart.com'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Sarah (EN/ES)
          </button>
          <button
            onClick={() => switchDemoRole('support_agent', 'kenji@convocart.com')}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              user?.email === 'kenji@convocart.com'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Kenji (JA/ZH/EN)
          </button>
          <button
            onClick={() => {
              logout();
              navigate('/shop');
            }}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-slate-700 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      </header>

      {/* Main Dispatch & Ticket Command Center */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        <Outlet />
      </main>

      <PersistentChatPanel />
    </div>
  );
};
