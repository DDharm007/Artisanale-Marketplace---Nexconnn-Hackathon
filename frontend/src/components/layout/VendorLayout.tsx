import React, { useEffect, useState } from 'react';
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
  ShieldCheck,
  Phone,
  Video,
  Languages,
  Headset,
  AlertTriangle,
  DollarSign,
  Mail,
  MapPin,
} from 'lucide-react';
import { SUPPORTED_CHAT_LANGUAGES, Vendor } from '@convocart/shared';
import { useAuthStore } from '../../stores/useAuthStore';
import { useChatStore } from '../../stores/useChatStore';
import { apiRequest } from '../../lib/api';
import { MessageBubble } from '../../features/chat/MessageBubble';
import { MessageComposer } from '../../features/chat/MessageComposer';
import { CallModal } from '../../features/chat/CallModal';
import { cn, formatCurrency } from '../../lib/utils';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

export const VendorLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, switchDemoRole } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    messages,
    unreadTotal,
    targetLanguage,
    autoTranslate,
    fetchConversations,
    refreshActiveMessages,
    selectConversation,
    sendMessage,
    sendPaymentRequest,
    updateConversationSettings,
    setTargetLanguage,
    toggleAutoTranslate,
    escalateConversation,
    startCall,
  } = useChatStore();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  const [payAmount, setPayAmount] = useState('99.00');
  const [payTitle, setPayTitle] = useState('Custom Store Invoice');

  const vendorId = user?.vendorId || 'me';

  useEffect(() => {
    apiRequest<Vendor>(`/vendors/${vendorId}`)
      .then((v) => setVendor(v))
      .catch(() => setVendor(null));
    fetchConversations();
    const interval = setInterval(() => {
      void fetchConversations();
      void refreshActiveMessages();
    }, 4000);
    return () => clearInterval(interval);
  }, [vendorId]);

  useEffect(() => {
    if (conversations.length === 0) return;
    const existsInList = conversations.some((c) => c.conversationId === activeConversationId);
    if (!activeConversationId || !existsInList) {
      void selectConversation(conversations[0].conversationId, false);
    }
  }, [conversations, activeConversationId]);

  const navItems = [
    { label: 'Overview', path: '/vendor', icon: LayoutDashboard, exact: true },
    { label: 'Statistics', path: '/vendor/statistics', icon: BarChart3 },
    { label: 'Products', path: '/vendor/products', icon: Package, exact: true },
    { label: 'Add Product', path: '/vendor/products/new', icon: PlusCircle },
    { label: 'Orders', path: '/vendor/orders', icon: ShoppingBag },
    { label: 'Customers', path: '/vendor/customers', icon: Users },
    {
      label: 'Conversations',
      path: '/vendor/conversations',
      icon: MessageSquare,
      badge: unreadTotal,
    },
    { label: 'AI Agent', path: '/vendor/ai-agent', icon: Bot, isNew: true },
    { label: 'Profile', path: '/vendor/profile', icon: User },
    { label: 'Settings', path: '/vendor/settings', icon: Settings },
    { label: 'Contact Support', path: '/vendor/support', icon: HelpCircle },
  ];

  const activeConv =
    conversations.find((c) => c.conversationId === activeConversationId) || conversations[0];
  const activeMsgs = activeConv ? messages[activeConv.conversationId] || [] : [];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans">
      {/* 1. LEFT SIDEBAR */}
      <aside
        className={cn(
          'flex flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 shrink-0 z-30',
          isSidebarCollapsed ? 'w-20' : 'w-64'
        )}
      >
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
            {isSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Dynamic Vendor Profile Pill */}
        {!isSidebarCollapsed && (
          <div className="mx-3 my-3 flex items-center gap-3 rounded-2xl bg-brand-50/70 p-2.5 border border-brand-100 dark:bg-slate-800/80 dark:border-slate-700">
            <img
              src={vendor?.logo || DEFAULT_AVATAR}
              alt="store logo"
              className="h-9 w-9 rounded-xl object-cover ring-1 ring-brand-300"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {vendor?.businessName || user?.displayName || 'Merchant Store'}
              </h4>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 capitalize">
                <ShieldCheck className="h-3 w-3" /> {vendor?.availability || 'online'} • Verified
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
        {/* Top workspace bar with multi-vendor quick switcher */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900 shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <NavLink
              to="/shop"
              className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
            >
              ← Back to Consumer Marketplace
            </NavLink>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => switchDemoRole('vendor', 'vendor@convocart.com')}
              className={cn(
                'rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors',
                user?.vendorId === 'vendor_nexconn_audio'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              Nexconn Audio
            </button>
            <button
              onClick={() => switchDemoRole('vendor', 'global@convocart.com')}
              className={cn(
                'rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors',
                user?.vendorId === 'vendor_ubuy_express'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              Ubuy Global (JP)
            </button>
            <button
              onClick={() => switchDemoRole('vendor', 'studio@convocart.com')}
              className={cn(
                'rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors',
                user?.vendorId === 'vendor_nexa_studio'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              NexaDigital Studio (HI)
            </button>
            <span className="hidden xl:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Nexconn Engine Active
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>

      {/* 3. RIGHT-SIDE MULTILINGUAL CUSTOMER CHAT */}
      <aside className="w-80 lg:w-96 flex flex-col border-l border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 shrink-0">
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

        {/* Multi-Language Translation Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-200">
          <div className="flex items-center gap-1.5">
            <Languages className="h-3.5 w-3.5 text-emerald-400" />
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[11px] text-white focus:outline-none"
            >
              {SUPPORTED_CHAT_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.code.toUpperCase()}
                </option>
              ))}
            </select>
            <button
              onClick={() => toggleAutoTranslate()}
              className={cn(
                'rounded px-2 py-0.5 text-[10px] font-bold border',
                autoTranslate
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              )}
            >
              Auto {autoTranslate ? 'ON' : 'OFF'}
            </button>
          </div>

          {activeConv && !activeConv.escalatedToSupport && !activeConv.assignedSupportAgentId && (
            <button
              onClick={() =>
                escalateConversation(
                  activeConv.conversationId,
                  'Vendor escalated conversation to Human Dispatch Center'
                )
              }
              className="inline-flex items-center gap-1 rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-amber-500/30"
              title="Escalate to Human Support Dispatch"
            >
              <Headset className="h-3 w-3" /> Escalate
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex gap-2 p-2 border-b border-slate-100 overflow-x-auto dark:border-slate-800 shrink-0">
            {conversations.map((c) => {
              const isSelected = activeConv?.conversationId === c.conversationId;
              return (
                <button
                  key={c.conversationId}
                  onClick={() => selectConversation(c.conversationId, false)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-2.5 py-1 text-xs font-medium transition-all shrink-0',
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  <img
                    src={c.consumerAvatar || DEFAULT_AVATAR}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover"
                  />
                  <span className="truncate max-w-[90px]">{c.consumerName}</span>
                  {c.status === 'escalated' && (
                    <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {activeConv ? (
            <div className="border-b border-slate-200 bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center justify-between px-3 py-2 text-xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {activeConv.consumerName}
                    </span>
                    {activeConv.consumerPreferredLanguage && (
                      <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-700">
                        {activeConv.consumerPreferredLanguage}
                      </span>
                    )}
                  </div>
                  {(activeConv.consumerEmail || activeConv.consumerPhone || activeConv.consumerAddressSummary || typeof activeConv.consumerTotalOrders === 'number') && (
                    <div className="mt-0.5 space-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                      {(activeConv.consumerEmail || activeConv.consumerPhone) && (
                        <div className="flex flex-wrap items-center gap-x-2 truncate max-w-[185px]">
                          {activeConv.consumerEmail && (
                            <span className="inline-flex items-center gap-0.5 truncate">
                              <Mail className="h-2.5 w-2.5 shrink-0" />
                              {activeConv.consumerEmail}
                            </span>
                          )}
                          {activeConv.consumerPhone && (
                            <span className="inline-flex items-center gap-0.5">
                              <Phone className="h-2.5 w-2.5 shrink-0" />
                              {activeConv.consumerPhone}
                            </span>
                          )}
                        </div>
                      )}
                      {activeConv.consumerAddressSummary && (
                        <p className="inline-flex items-center gap-0.5 truncate max-w-[185px]">
                          <MapPin className="h-2.5 w-2.5 shrink-0" />
                          {activeConv.consumerAddressSummary}
                        </p>
                      )}
                      {typeof activeConv.consumerTotalOrders === 'number' && (
                        <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {activeConv.consumerTotalOrders} order{activeConv.consumerTotalOrders === 1 ? '' : 's'} •{' '}
                          {formatCurrency(activeConv.consumerTotalSpent || 0)}
                        </p>
                      )}
                    </div>
                  )}
                  {activeConv.productTitle && (
                    <p className="text-[10px] text-brand-600 truncate max-w-[175px]">
                      {activeConv.productTitle}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() =>
                      void updateConversationSettings(activeConv.conversationId, {
                        aiHandlingEnabled: !activeConv.aiHandlingEnabled,
                      })
                    }
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold border transition-colors',
                      activeConv.aiHandlingEnabled
                        ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    )}
                    title="Toggle between AI Concierge auto-reply and Human Seller Takeover"
                  >
                    {activeConv.aiHandlingEnabled ? (
                      <>
                        <Bot className="h-3 w-3" /> AI Auto
                      </>
                    ) : (
                      <>
                        <User className="h-3 w-3" /> Seller Live
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowPaymentPrompt((v) => !v)}
                    className="rounded-lg p-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                    title="Send In-Chat Payment Request ($)"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                  </button>
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

              {showPaymentPrompt && (
                <div className="flex items-center gap-1.5 border-t border-slate-200 bg-emerald-50/70 px-3 py-2 text-[11px]">
                  <input
                    type="text"
                    value={payTitle}
                    onChange={(e) => setPayTitle(e.target.value)}
                    placeholder="Invoice title"
                    className="flex-1 min-w-0 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] focus:outline-none"
                  />
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-16 rounded border border-slate-300 bg-white px-1.5 py-1 text-[11px] focus:outline-none"
                  />
                  <button
                    onClick={async () => {
                      const amt = parseFloat(payAmount);
                      if (!Number.isFinite(amt) || amt <= 0) return;
                      await sendPaymentRequest(
                        activeConv.conversationId,
                        amt,
                        payTitle || 'Custom Payment Request',
                        activeConv.orderId
                      );
                      setShowPaymentPrompt(false);
                    }}
                    className="rounded bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
                  >
                    Send $
                  </button>
                </div>
              )}
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-[#0b141a]">
            {activeMsgs.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                isMe={m.senderId === user?.uid}
                targetLanguage={targetLanguage}
              />
            ))}
          </div>

          <MessageComposer
            conversationId={activeConv?.conversationId}
            onSendMessage={(text, type, mediaUrl, metadata) =>
              sendMessage(text, type, mediaUrl, metadata, activeConv?.conversationId)
            }
            targetLanguage={targetLanguage}
          />
        </div>
      </aside>

      <CallModal />
    </div>
  );
};
