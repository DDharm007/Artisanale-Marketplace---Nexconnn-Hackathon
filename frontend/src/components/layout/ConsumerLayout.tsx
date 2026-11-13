import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { PersistentChatPanel } from '../../features/chat/PersistentChatPanel';

export const ConsumerLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {/* Persistent Right-Side Chat Panel */}
      <PersistentChatPanel />
    </div>
  );
};
