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
  Menu,
  X,
} from 'lucide-react';
import { SUPPORTED_CHAT_LANGUAGES, Vendor } from '@convocart/shared';
import { useAuthStore } from '../../stores/useAuthStore';
import { useChatStore } from '../../stores/useChatStore';
import { apiRequest } from '../../lib/api';
import { MessageBubble } from '../../features/chat/MessageBubble';
import { MessageComposer } from '../../features/chat/MessageComposer';
import { CallModal } from '../../features/chat/CallModal';
import { WHATSAPP_DARK_BG_STYLE } from '../../features/chat/whatsappWallpaper';
import { cn, formatCurrency } from '../../lib/utils';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200&auto=format&fit=crop&q=80';

export const VendorLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
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

  // Reusable Sidebar Nav Content
  const renderNavContent = (isMobile = false) => (
    <>
      <div className="flex h-16 items-center justify-between px-4 border-b border-[#E4DEC8]">
        <div className="flex items-center gap-2 overflow-hidden">
          <span
            className="text-2xl font-normal text-[#171717] tracking-tight select-none"
            style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
          >
            artisanale
          </span>
          {(!isSidebarCollapsed || isMobile) && (
            <span className="rounded-full bg-[#171717] text-[#D6B875] px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase">
              STUDIO
            </span>
          )}
        </div>
        {isMobile ? (
          <button
            onClick={() => setIsMobileNavOpen(false)}
            className="rounded-lg p-1.5 text-[#8C867A] hover:bg-[#ECEAE4] hover:text-[#171717] transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="rounded-lg p-1.5 text-[#8C867A] hover:bg-[#ECEAE4] hover:text-[#171717] transition-colors cursor-pointer"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Dynamic Vendor Profile Pill */}
      {(!isSidebarCollapsed || isMobile) && (
        <div className="mx-3 my-3 flex items-center gap-3 rounded-2xl bg-[#ECEAE4]/80 p-2.5 border border-[#E4DEC8]">
          <img
            src={
              vendor?.logo && !vendor.logo.includes('photo-1546435770')
                ? vendor.logo
                : DEFAULT_AVATAR
            }
            alt="store logo"
            className="h-9 w-9 rounded-xl object-cover ring-1 ring-[#D6B875] shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-[#171717] truncate">
              {vendor?.businessName || user?.displayName || 'Artisan Studio'}
            </h4>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#686359] capitalize">
              <ShieldCheck className="h-3 w-3 text-[#D6B875]" /> {vendor?.availability || 'online'} • Verified
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
              onClick={() => {
                if (isMobile) setIsMobileNavOpen(false);
              }}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-colors group relative',
                  isActive
                    ? 'bg-[#171717] text-[#D6B875] font-semibold shadow-xs'
                    : 'text-[#686359] hover:bg-[#ECEAE4] hover:text-[#171717]'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {(!isSidebarCollapsed || isMobile) && <span className="truncate">{item.label}</span>}
              {(!isSidebarCollapsed || isMobile) && item.badge ? (
                <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-[#171717] border border-[#D6B875]/40 text-[10px] font-bold text-[#D6B875]">
                  {item.badge}
                </span>
              ) : null}
              {(!isSidebarCollapsed || isMobile) && item.isNew && (
                <span className="ml-auto rounded bg-[#171717] text-[#D6B875] px-1 text-[9px] font-bold">
                  AI
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-[#E4DEC8] p-2">
        <button
          onClick={() => {
            logout();
            navigate('/shop');
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-[#8C867A] hover:text-rose-700 hover:bg-rose-50/50 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {(!isSidebarCollapsed || isMobile) && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  // Reusable Customer Chat Aside Content
  const renderChatAside = (isMobileDrawer = false) => (
    <div className="flex flex-col h-full bg-[#FAF8F3]">
      <div className="flex h-16 items-center justify-between border-b border-[#E4DEC8] px-4 bg-[#FAF8F3]">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#171717]" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#171717]">
            Customer Conversations
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#171717] px-2.5 py-0.5 text-[10px] font-bold text-[#D6B875]">
            {conversations.length} Active
          </span>
          {isMobileDrawer && (
            <button
              onClick={() => setIsMobileChatOpen(false)}
              className="p-1 text-[#686359] hover:text-[#171717] cursor-pointer"
              aria-label="Close Chat"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Multi-Language Translation Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-[#E4DEC8] bg-[#171717] px-3 py-1.5 text-[11px] text-[#ECEAE4]">
        <div className="flex items-center gap-1.5">
          <Languages className="h-3.5 w-3.5 text-[#D6B875]" />
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="rounded bg-black/60 border border-[#D6B875]/30 px-1.5 py-0.5 text-[11px] text-white focus:outline-none"
          >
            {SUPPORTED_CHAT_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.code.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => toggleAutoTranslate()}
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer',
            autoTranslate
              ? 'bg-[#D6B875] text-[#171717]'
              : 'border border-[#D6B875]/40 text-[#D6B875] hover:bg-white/10'
          )}
        >
          {autoTranslate ? 'Auto-Translate ON' : 'Translate OFF'}
        </button>
      </div>

      {/* Top mini conversation selector tabs */}
      <div className="flex overflow-x-auto border-b border-[#E4DEC8] bg-[#FAF8F3] p-1.5 gap-1.5 no-scrollbar shrink-0">
        {conversations.slice(0, 8).map((c) => {
          const isSelected = activeConv?.conversationId === c.conversationId;
          const unread = user ? c.unreadCount?.[user.uid] || 0 : 0;
          return (
            <button
              key={c.conversationId}
              onClick={() => void selectConversation(c.conversationId, false)}
              className={cn(
                'relative flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0',
                isSelected
                  ? 'bg-[#171717] text-[#D6B875] shadow-xs'
                  : 'bg-white text-[#686359] border border-[#E4DEC8] hover:bg-[#ECEAE4]'
              )}
            >
              <img
                src={c.consumerAvatar || DEFAULT_AVATAR}
                alt=""
                className="h-4 w-4 rounded-full object-cover shrink-0"
              />
              <span className="truncate max-w-[85px]">{c.consumerName.split(' ')[0]}</span>
              {unread > 0 && (
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Conversation Stage */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#171717]">
        {activeConv ? (
          <div className="bg-[#201C18] px-4 py-2.5 border-b border-[#332D27] flex items-center justify-between text-xs text-white shrink-0">
            <div className="min-w-0 flex items-center gap-2">
              <img
                src={activeConv.consumerAvatar || DEFAULT_AVATAR}
                alt=""
                className="h-7 w-7 rounded-full object-cover border border-[#D6B875]/40 shrink-0"
              />
              <div className="truncate">
                <p className="font-bold text-white truncate text-[11px]">{activeConv.consumerName}</p>
                <p className="text-[10px] text-[#A8A29E] truncate">
                  {activeConv.productTitle || 'General Store Dialogue'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[#D6B875]">
              <button
                onClick={() => startCall(activeConv.consumerName, activeConv.consumerAvatar, false)}
                className="p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                title="Voice Call"
              >
                <Phone className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => startCall(activeConv.consumerName, activeConv.consumerAvatar, true)}
                className="p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                title="Video Call"
              >
                <Video className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : null}

        <div style={WHATSAPP_DARK_BG_STYLE} className="flex-1 overflow-y-auto p-3 space-y-1">
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
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#ECEAE4] text-[#171717] font-sans">
      {/* 1. DESKTOP LEFT SIDEBAR (hidden on <md) */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-[#E4DEC8] bg-[#FAF8F3] transition-all duration-300 shrink-0 z-30',
          isSidebarCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {renderNavContent(false)}
      </aside>

      {/* MOBILE LEFT SIDEBAR DRAWER (<md) */}
      {isMobileNavOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#FAF8F3] border-r border-[#E4DEC8] shadow-2xl md:hidden animate-in slide-in-from-left duration-250">
            {renderNavContent(true)}
          </aside>
        </>
      )}

      {/* 2. CENTER WORKSPACE */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#ECEAE4] min-w-0">
        {/* Top workspace bar */}
        <div className="flex h-16 items-center justify-between border-b border-[#E4DEC8] bg-[#FAF8F3] px-4 sm:px-6 shrink-0 gap-3">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle for Left Nav */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-[#171717] hover:bg-[#ECEAE4] transition-colors cursor-pointer"
              aria-label="Open Studio Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <NavLink
              to="/shop"
              className="text-xs font-semibold text-[#171717] hover:text-[#D6B875] flex items-center gap-1.5 transition-colors"
            >
              ← Back to Marketplace
            </NavLink>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[11px] font-medium text-[#8C867A]">
              Studio Workspace
            </span>

            {/* Mobile & Tablet Customer Chat Button (<xl) */}
            <button
              onClick={() => setIsMobileChatOpen(true)}
              className="xl:hidden flex items-center gap-1.5 rounded-full bg-[#171717] px-3 py-1.5 text-xs font-semibold text-[#D6B875] hover:bg-black transition-colors cursor-pointer"
              title="Customer Conversations"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Chat</span>
              {unreadTotal > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#D6B875] text-[9px] font-bold text-[#171717]">
                  {unreadTotal}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </div>
      </main>

      {/* 3. DESKTOP RIGHT-SIDE CUSTOMER CHAT (hidden on <xl, shown on xl+) */}
      <aside className="hidden xl:flex w-80 lg:w-96 flex-col border-l border-[#E4DEC8] bg-[#FAF8F3] shadow-sm shrink-0">
        {renderChatAside(false)}
      </aside>

      {/* MOBILE / TABLET RIGHT-SIDE CHAT DRAWER (<xl) */}
      {isMobileChatOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs xl:hidden"
            onClick={() => setIsMobileChatOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[360px] xs:max-w-[400px] flex-col bg-[#FAF8F3] border-l border-[#E4DEC8] shadow-2xl xl:hidden animate-in slide-in-from-right duration-250">
            {renderChatAside(true)}
          </aside>
        </>
      )}

      <CallModal />
    </div>
  );
};
