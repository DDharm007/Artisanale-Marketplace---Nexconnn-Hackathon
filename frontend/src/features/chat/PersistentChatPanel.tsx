import React, { useEffect, useState, useRef } from 'react';
import {
  MessageSquare,
  X,
  Phone,
  Video,
  Search,
  ChevronLeft,
  Bot,
  ExternalLink,
  Languages,
  Headset,
  CheckCircle2,
  AlertTriangle,
  Store,
  Loader2,
  LogIn,
} from 'lucide-react';
import { SUPPORTED_CHAT_LANGUAGES } from '@convocart/shared';
import { useChatStore } from '../../stores/useChatStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { CallModal } from './CallModal';
import { WHATSAPP_DARK_BG_STYLE } from './whatsappWallpaper';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

export const PersistentChatPanel: React.FC = () => {
  const { user } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    messages,
    isDrawerOpen,
    unreadTotal,
    targetLanguage,
    autoTranslate,
    isTranslating,
    fetchConversations,
    refreshActiveMessages,
    selectConversation,
    sendMessage,
    toggleDrawer,
    setTargetLanguage,
    toggleAutoTranslate,
    updateConversationSettings,
    escalateConversation,
    dispatchConversation,
    startCall,
  } = useChatStore();

  const [search, setSearch] = useState('');
  const [isEscalating, setIsEscalating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    void fetchConversations();
    const interval = setInterval(() => {
      void fetchConversations();
      if (useChatStore.getState().isDrawerOpen) {
        void refreshActiveMessages();
      }
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const activeConv = conversations.find((c) => c.conversationId === activeConversationId);
  const activeMsgs = activeConversationId ? messages[activeConversationId] || [] : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMsgs]);

  const filteredConversations = conversations.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.vendorBusinessName.toLowerCase().includes(q) ||
      c.consumerName.toLowerCase().includes(q) ||
      (c.productTitle && c.productTitle.toLowerCase().includes(q)) ||
      (c.assignedSupportAgentName && c.assignedSupportAgentName.toLowerCase().includes(q))
    );
  });

  const handlePayRequest = (amount: number, orderId?: string) => {
    navigate('/shop/checkout', { state: { directPaymentAmount: amount, orderId } });
    toggleDrawer(false);
  };

  const handleRequestHumanAgent = async () => {
    if (!activeConv || isEscalating) return;
    setIsEscalating(true);
    try {
      await escalateConversation(
        activeConv.conversationId,
        'User requested live human support intervention'
      );
    } finally {
      setIsEscalating(false);
    }
  };

  const handleResolveDispatch = async () => {
    if (!activeConv || isEscalating) return;
    setIsEscalating(true);
    try {
      await dispatchConversation(activeConv.conversationId, { action: 'resolve' });
    } finally {
      setIsEscalating(false);
    }
  };

  const handleSwitchToAiMode = async () => {
    if (!activeConv || isEscalating) return;
    setIsEscalating(true);
    try {
      await updateConversationSettings(activeConv.conversationId, {
        aiHandlingEnabled: true,
      });
    } finally {
      setIsEscalating(false);
    }
  };

  const getCounterpartName = (c: typeof conversations[number]) => {
    if (user?.role === 'vendor') return c.consumerName;
    if (user?.role === 'support_agent' || user?.role === 'admin') {
      return `${c.consumerName} ↔ ${c.vendorBusinessName}`;
    }
    return c.vendorBusinessName;
  };

  const getCounterpartAvatar = (c: typeof conversations[number]) => {
    if (user?.role === 'vendor') return c.consumerAvatar || FALLBACK_AVATAR;
    return c.vendorLogo || c.consumerAvatar || FALLBACK_AVATAR;
  };

  return (
    <>
      {/* WhatsApp Floating Toggle Button */}
      {!isDrawerOpen && (
        <button
          onClick={() => toggleDrawer(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[#00a884] hover:bg-[#029676] px-4 py-2.5 text-[#111b21] shadow-2xl hover:scale-105 active:scale-95 transition-all text-xs font-bold"
        >
          <div className="relative">
            <MessageSquare className="h-4 w-4 fill-current" />
            {unreadTotal > 0 && (
              <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white">
                {unreadTotal}
              </span>
            )}
          </div>
          <span>Nexconn Chat</span>
        </button>
      )}

      {/* WhatsApp Style Persistent Right-Side Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-[#111b21] shadow-2xl border-l border-[#222d34] transition-transform duration-300 ease-in-out',
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-[#222d34] px-3.5 py-3 bg-[#202c33] text-[#e9edef]">
          <div className="flex items-center gap-2 min-w-0">
            {activeConversationId && (
              <button
                onClick={() => useChatStore.setState({ activeConversationId: null })}
                className="rounded-full p-1 text-[#aebac1] hover:text-white hover:bg-[#2a3942] transition-colors"
                title="Back to Chats"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {activeConv ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={getCounterpartAvatar(activeConv)}
                    alt="avatar"
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  <span
                    className={cn(
                      'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-[#202c33]',
                      activeConv.vendorAvailability === 'away' ? 'bg-amber-400' : 'bg-[#00a884]'
                    )}
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-[#e9edef] leading-tight truncate">
                    {getCounterpartName(activeConv)}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {activeConv.assignedSupportAgentId ||
                    activeConv.escalatedToSupport ||
                    activeConv.status === 'escalated' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
                        <Headset className="h-3 w-3" />
                        {activeConv.assignedSupportAgentName
                          ? `Agent: ${activeConv.assignedSupportAgentName}`
                          : 'Dispatch Queue'}
                      </span>
                    ) : !activeConv.aiHandlingEnabled ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#00a884]">
                        <Store className="h-3 w-3" /> Live Seller
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#53bdeb]">
                        <Bot className="h-3 w-3" /> AI Concierge •{' '}
                        {activeConv.vendorAvailability || 'online'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#e9edef] text-base">1-on-1 Chat Hub</h3>
              </div>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1 text-[#aebac1]">
            {activeConv && (
              <>
                <button
                  onClick={() =>
                    startCall(
                      getCounterpartName(activeConv),
                      getCounterpartAvatar(activeConv),
                      false
                    )
                  }
                  className="rounded-full p-2 hover:text-white hover:bg-[#2a3942] transition-colors"
                  title="Voice Call"
                >
                  <Phone className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    startCall(
                      getCounterpartName(activeConv),
                      getCounterpartAvatar(activeConv),
                      true
                    )
                  }
                  className="rounded-full p-2 hover:text-white hover:bg-[#2a3942] transition-colors"
                  title="Video Call"
                >
                  <Video className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={() => toggleDrawer(false)}
              className="rounded-full p-2 hover:text-white hover:bg-[#2a3942] transition-colors"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Multi-Language Translation & Dispatch Bar (always accessible inside active chat or list) */}
        <div className="flex items-center justify-between gap-2 border-b border-[#222d34] bg-[#182229] px-3 py-1.5 text-[11px] text-[#d1d7db]">
          <div className="flex items-center gap-1.5 min-w-0">
            <Languages className="h-3.5 w-3.5 text-[#00a884] shrink-0" />
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="rounded bg-[#202c33] border border-[#2a3942] px-1.5 py-0.5 text-[11px] font-medium text-[#e9edef] focus:outline-none"
              aria-label="Target Chat Language"
            >
              {SUPPORTED_CHAT_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.nativeName}
                </option>
              ))}
            </select>
            <button
              onClick={() => toggleAutoTranslate()}
              className={cn(
                'inline-flex items-center gap-1 rounded px-2 py-0.5 font-semibold transition-colors',
                autoTranslate
                  ? 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/40'
                  : 'bg-[#202c33] text-[#8696a0] border border-[#2a3942] hover:text-[#d1d7db]'
              )}
              title="Automatically translate incoming messages via Nexconn TranslateModule"
            >
              {isTranslating && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
              Auto-Translate {autoTranslate ? 'ON' : 'OFF'}
            </button>
          </div>

          {activeConv &&
            ((user?.role === 'support_agent' || user?.role === 'admin') &&
            (activeConv.status === 'escalated' ||
              Boolean(activeConv.assignedSupportAgentId) ||
              activeConv.escalatedToSupport) ? (
              <button
                onClick={handleResolveDispatch}
                disabled={isEscalating}
                className="inline-flex items-center gap-1 rounded bg-emerald-600/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300 hover:bg-emerald-600/30 shrink-0"
              >
                <CheckCircle2 className="h-3 w-3" /> Resolve
              </button>
            ) : !activeConv.escalatedToSupport && !activeConv.assignedSupportAgentId ? (
              <button
                onClick={handleRequestHumanAgent}
                disabled={isEscalating}
                className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-amber-500/25 shrink-0"
                title="Escalate chat to Human Agent Dispatch Center"
              >
                <Headset className="h-3 w-3" /> Human Agent
              </button>
            ) : (
              <button
                onClick={handleSwitchToAiMode}
                disabled={isEscalating}
                className="inline-flex items-center gap-1 rounded bg-[#53bdeb]/15 border border-[#53bdeb]/40 px-2 py-0.5 text-[10px] font-bold text-[#53bdeb] hover:bg-[#53bdeb]/25 shrink-0"
                title="Resume AI Concierge mode for instant product & policy Q&A"
              >
                <Bot className="h-3 w-3" /> AI Mode
              </button>
            ))}
        </div>

        {/* Panel Body */}
        {activeConversationId ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Escalation / Dispatch Status Banner */}
            {activeConv &&
              (activeConv.status === 'escalated' ||
                activeConv.escalatedToSupport ||
                Boolean(activeConv.assignedSupportAgentId)) && (
              <div className="flex items-center justify-between gap-2 border-b border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-[11px] text-amber-200">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">
                    {activeConv.assignedSupportAgentName
                      ? `Live Specialist: ${activeConv.assignedSupportAgentName}`
                      : `Assigned to Dispatch Specialist • ${activeConv.escalationReason || 'Escalated'}`}
                  </span>
                </div>
                <button
                  onClick={handleSwitchToAiMode}
                  disabled={isEscalating}
                  className="rounded bg-[#202c33] border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-[#53bdeb] hover:bg-[#2a3942] shrink-0"
                >
                  AI Concierge
                </button>
              </div>
            )}

            {/* Linked Product Bar */}
            {activeConv?.productTitle && (
              <div className="flex items-center justify-between border-b border-[#222d34] bg-[#182229] px-3.5 py-2 text-xs">
                <div className="flex items-center gap-2 truncate text-[#d1d7db]">
                  {activeConv.productImage && (
                    <img
                      src={activeConv.productImage}
                      alt=""
                      className="h-7 w-7 rounded object-cover"
                    />
                  )}
                  <span className="truncate font-medium">{activeConv.productTitle}</span>
                </div>
                {activeConv.productId && (
                  <button
                    onClick={() => {
                      navigate(`/shop/products/${activeConv.productId}`);
                      toggleDrawer(false);
                    }}
                    className="flex items-center gap-1 font-bold text-[#53bdeb] hover:underline shrink-0 text-[11px] ml-2"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}

            {/* Messages Scroll Area */}
            <div
              style={WHATSAPP_DARK_BG_STYLE}
              className="flex-1 overflow-y-auto p-4 space-y-1"
            >
              <div className="text-center my-2">
                <span className="inline-block rounded-md bg-[#182229]/90 border border-[#222d34] px-3 py-1 text-[11px] text-[#8696a0] shadow-xs">
                  🔒 End-to-end Nexconn Chat SDK • Auto-translation ready
                </span>
              </div>

              {activeMsgs.length === 0 ? (
                <div className="flex h-3/4 flex-col items-center justify-center text-center p-6 text-[#8696a0]">
                  <MessageSquare className="h-10 w-10 text-[#00a884] mb-2 opacity-60" />
                  <p className="text-sm font-semibold text-[#e9edef]">
                    Start chatting in any language
                  </p>
                  <p className="text-xs text-[#8696a0] mt-1">
                    Ask about specs, stock, bulk quotes, or escalate anytime to a human support specialist.
                  </p>
                </div>
              ) : (
                activeMsgs.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    isMe={m.senderId === user?.uid}
                    onPayRequest={handlePayRequest}
                    targetLanguage={targetLanguage}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <MessageComposer
              onSendMessage={sendMessage}
              targetLanguage={targetLanguage}
              quickActions={
                activeConv?.productId
                  ? [
                      {
                        label: 'Share Linked Product',
                        onClick: () =>
                          sendMessage(
                            `Checking details for ${activeConv.productTitle}`,
                            'product_card',
                            undefined,
                            {
                              productId: activeConv.productId,
                              productTitle: activeConv.productTitle,
                              productImage: activeConv.productImage,
                            }
                          ),
                      },
                    ]
                  : undefined
              }
            />
          </div>
        ) : (
          /* Conversations List View */
          <div className="flex flex-1 flex-col overflow-hidden bg-[#111b21]">
            <div className="p-2.5 border-b border-[#222d34] bg-[#111b21]">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8696a0]" />
                <input
                  type="text"
                  placeholder="Search chats, sellers, or agents"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg bg-[#202c33] pl-9 pr-3 py-1.5 text-xs text-[#d1d7db] placeholder:text-[#8696a0] border-none focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#222d34]">
              {!user ? (
                <div className="p-8 text-center text-[#8696a0] space-y-3">
                  <LogIn className="h-10 w-10 mx-auto text-[#00a884] opacity-80" />
                  <p className="text-sm font-bold text-[#e9edef]">Sign in to chat with sellers</p>
                  <p className="text-xs text-[#8696a0]">
                    Use your customer account to message sellers, translate live chats, and track order updates.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      toggleDrawer(false);
                      navigate('/auth');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#00a884] px-4 py-2 text-xs font-bold text-[#111b21] hover:bg-[#029676] transition-colors"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Sign In or Create Account
                  </button>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-[#8696a0]">
                  <MessageSquare className="h-10 w-10 mx-auto text-[#00a884] mb-2 opacity-60" />
                  <p className="text-sm font-bold text-[#e9edef]">No chats yet</p>
                  <p className="text-xs text-[#8696a0] mt-1">
                    Click &quot;Chat Seller&quot; on any product card to start a 1-on-1 conversation.
                  </p>
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const unread = user
                    ? (c.unreadCount?.[user.uid] || 0) +
                      (user.vendorId && user.vendorId !== user.uid
                        ? c.unreadCount?.[user.vendorId] || 0
                        : 0)
                    : 0;
                  return (
                    <button
                      key={c.conversationId}
                      onClick={() => selectConversation(c.conversationId)}
                      className="flex w-full items-center gap-3 p-3.5 text-left bg-[#111b21] hover:bg-[#202c33] transition-colors"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={getCounterpartAvatar(c)}
                          alt=""
                          className="h-11 w-11 rounded-full object-cover"
                        />
                        <span
                          className={cn(
                            'absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-[#111b21]',
                            c.status === 'escalated' ? 'bg-amber-400' : 'bg-[#00a884]'
                          )}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-sm text-[#e9edef] truncate">
                            {getCounterpartName(c)}
                          </h4>
                          {c.lastMessage && (
                            <span className="text-[11px] text-[#8696a0] shrink-0">
                              {new Date(c.lastMessage.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5">
                          {c.status === 'escalated' && (
                            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-300">
                              {c.assignedSupportAgentName ? 'Agent Active' : 'Dispatch'}
                            </span>
                          )}
                          {c.consumerPreferredLanguage &&
                            c.consumerPreferredLanguage !== 'en' && (
                              <span className="rounded bg-[#2a3942] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#53bdeb]">
                                {c.consumerPreferredLanguage}
                              </span>
                            )}
                          {c.productTitle && (
                            <span className="text-[11px] font-semibold text-[#00a884] truncate">
                              {c.productTitle}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#8696a0] truncate mt-0.5">
                          {c.lastMessage?.text || 'No messages yet'}
                        </p>
                      </div>

                      {unread > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00a884] text-[10px] font-bold text-[#111b21] shrink-0">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active Nexconn Call Modal */}
      <CallModal />
    </>
  );
};
