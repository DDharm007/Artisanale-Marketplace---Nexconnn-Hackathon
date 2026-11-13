import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Headphones, Shield, LogOut, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { PersistentChatPanel } from '../../features/chat/PersistentChatPanel';

export const SupportLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Support Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/shop')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Market
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
              <Headphones className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">ConvoCart Support Command Center</h2>
              <p className="text-[10px] text-slate-400">Agent: {user?.displayName || 'Sarah Connor'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
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

      {/* Main Support Queue */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        <Outlet />
      </main>

      <PersistentChatPanel />
    </div>
  );
};
