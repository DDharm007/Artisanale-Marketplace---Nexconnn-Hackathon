import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Package,
  PlusCircle,
  ShoppingBag,
  Users,
  MessageSquare,
  Bot,
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  ShieldCheck,
  Store,
  Phone,
  Video,
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useChatStore } from '../../stores/useChatStore';
import { MessageBubble } from '../../features/chat/MessageBubble';
import { MessageComposer } from '../../features/chat/MessageComposer';
import { CallModal } from '../../features/chat/CallModal';
import { cn } from '../../lib/utils';

export const VendorLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    messages,
    selectConversation,
    sendMessage,
    unreadTotal,
    startCall,
  } = useChatStore();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 12 Exact Navigation Links as specified in Section 7
  const navItems = [
    { label: 'Overview', path: '/vendor', icon: LayoutDashboard, exact: true },
    { label: 'Statistics', path: '/vendor/statistics', icon: BarChart3 },
    { label: 'Products', path: '/vendor/products', icon: Package, exact: true },
    { label: 'Add Product', path: '/vendor/products/new', icon: PlusCircle },
    { label: 'Orders', path: '/vendor/orders', icon: ShoppingBag },
    { label: 'Customers', path: '/vendor/customers', icon: Users },
    { label: 'Conversations', path: '/vendor/conversations', icon: MessageSquare, badge: unreadTotal },
    { label: 'AI Agent', path: '/vendor/ai-agent', icon: Bot, isNew: true },
    { label: 'Profile', path: '/vendor/profile', icon: User },
    { label: 'Settings', path: '/vendor/settings', icon: Settings },
    { label: 'Contact Support', path: '/vendor/support', icon: HelpCircle },
  ];

  const activeConv = conversations.find((c) => c.conversationId === activeConversationId) || conversations[0];
  const activeMsgs = activeConv ? messages[activeConv.conversationId] || [] : [];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans">
      {/* 1. LEFT SIDEBAR (Sticky, Collapsible, 12 Items) */}
      <aside
        className={cn(
          'flex flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 shrink-0 z-30',
          isSidebarCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img src="/logo.png" alt="ConvoCart" className="h-9 w-auto shrink-0 brightness-110" />
            {!isSidebarCollapsed && (
              <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                Vendor Studio
              </span>
            )}
          </div>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Vendor Profile Info Pill */}
        {!isSidebarCollapsed && (
          <div className="mx-3 my-3 flex items-center gap-3 rounded-2xl bg-brand-50/70 p-2.5 border border-brand-100 dark:bg-slate-800/80 dark:border-slate-700">
            <img
              src="https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200&auto=format&fit=crop&q=80"
              alt="store logo"
              className="h-9 w-9 rounded-xl object-cover ring-1 ring-brand-300"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                Nexconn Audio
              </h4>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                <ShieldCheck className="h-3 w-3" /> Verified Seller
              </span>
            </div>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-colors group relative',
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                {!isSidebarCollapsed && item.badge ? (
                  <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                ) : null}
                {!isSidebarCollapsed && item.isNew && (
                  <span className="ml-auto rounded bg-purple-100 px-1 text-[9px] font-bold text-purple-700">
                    AI
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* 12. Logout item */}
        <div className="border-t border-slate-200 p-2 dark:border-slate-800">
          <button
            onClick={() => {
              logout();
              navigate('/shop');
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* 2. CENTER WORKSPACE */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Top workspace bar */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <NavLink
              to="/shop"
              className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
            >
              ← Back to Consumer Marketplace
            </NavLink>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Nexconn Real-Time Engine Active
            </span>
          </div>
        </div>

        {/* Dynamic Center Page Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>

      {/* 3. RIGHT-SIDE CUSTOMER CHAT (Persistent across vendor dashboard pages) */}
      <aside className="w-80 lg:w-96 flex flex-col border-l border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 shrink-0">
        {/* Chat Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-brand-600" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Customer Conversations
            </h3>
          </div>
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
            {conversations.length} Active
          </span>
        </div>

        {/* Split: Customer Conversation Picker + Active Chat */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Recent Customer Threads */}
          <div className="flex gap-2 p-2 border-b border-slate-100 overflow-x-auto dark:border-slate-800 shrink-0">
            {conversations.map((c) => {
              const isSelected = activeConv?.conversationId === c.conversationId;
              return (
                <button
                  key={c.conversationId}
                  onClick={() => selectConversation(c.conversationId)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-2.5 py-1 text-xs font-medium transition-all shrink-0',
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  <img
                    src={
                      c.consumerAvatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                    }
                    alt=""
                    className="h-5 w-5 rounded-full object-cover"
                  />
                  <span className="truncate max-w-[90px]">{c.consumerName}</span>
                </button>
              );
            })}
          </div>

          {/* Active Conversation Detail Bar */}
          {activeConv ? (
            <div className="flex items-center justify-between bg-slate-50 px-3 py-2 border-b border-slate-200 text-xs dark:bg-slate-800/40">
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {activeConv.consumerName}
                </span>
                {activeConv.productTitle && (
                  <p className="text-[10px] text-brand-600 truncate max-w-[180px]">
                    {activeConv.productTitle}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startCall(activeConv.consumerName, activeConv.consumerAvatar, false)}
                  className="rounded-lg p-1 text-slate-600 hover:bg-slate-200"
                  title="Call Customer"
                >
                  <Phone className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => startCall(activeConv.consumerName, activeConv.consumerAvatar, true)}
                  className="rounded-lg p-1 text-slate-600 hover:bg-slate-200"
                  title="Video Call"
                >
                  <Video className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : null}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-slate-50/30">
            {activeMsgs.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                isMe={m.senderId === user?.uid}
              />
            ))}
          </div>

          {/* Composer */}
          <MessageComposer onSendMessage={sendMessage} />
        </div>
      </aside>

      {/* Call Modal */}
      <CallModal />
    </div>
  );
};
