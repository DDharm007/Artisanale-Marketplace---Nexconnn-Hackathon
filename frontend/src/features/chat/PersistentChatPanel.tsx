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
  Sparkles,
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

const DEFAULT_ARTISAN_AVATAR =
  'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200&auto=format&fit=crop&q=80';

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
  const [showLangMenu, setShowLangMenu] = useState(false);
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
    const isVendorOwner = user?.vendorId === c.vendorId || user?.uid === c.vendorOwnerUid;
    if (isVendorOwner) return c.consumerName || 'Valued Collector';
    if (user?.role === 'support_agent' || user?.role === 'admin') {
      return `${c.consumerName} ↔ ${c.vendorBusinessName}`;
    }
    return c.vendorBusinessName || 'Artisan Studio';
  };

  const getCounterpartAvatar = (c: typeof conversations[number]) => {
    const isVendorOwner = user?.vendorId === c.vendorId || user?.uid === c.vendorOwnerUid;
    if (isVendorOwner) return c.consumerAvatar || DEFAULT_ARTISAN_AVATAR;
    return c.vendorLogo || DEFAULT_ARTISAN_AVATAR;
  };

  return (
    <>
      {/* Semi-transparent backdrop overlay when drawer is open */}
      {isDrawerOpen && (
        <div
          onClick={() => toggleDrawer(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Floating Toggle Button (only shown when unread messages exist) */}
      {!isDrawerOpen && unreadTotal > 0 && (
        <button
          onClick={() => toggleDrawer(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[#171717] hover:bg-black px-4 py-2.5 text-white shadow-xl transition-all text-xs font-medium cursor-pointer"
        >
          <div className="relative">
            <MessageSquare className="h-4 w-4 text-[#D6B875]" />
            <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#D6B875] text-[9px] font-bold text-[#171717]">
              {unreadTotal}
            </span>
          </div>
          <span>Messages</span>
        </button>
      )}

      {/* Artisanale Minimalist Right-Side Chat Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-[#171717] text-[#FAF8F5] shadow-2xl border-l border-[#26221D] transition-transform duration-300 ease-in-out',
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* ── 1. MINIMAL ARTISANALE HEADER ────────────────────────── */}
        <div className="flex items-center justify-between border-b border-[#26221D] px-4 py-3 bg-[#171717] text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            {activeConversationId && (
              <button
                onClick={() => useChatStore.setState({ activeConversationId: null })}
                className="rounded-full p-1 text-[#A8A29E] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Back to All Conversations"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            {activeConv ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={getCounterpartAvatar(activeConv)}
                    alt="Artisan Studio"
                    className="h-9 w-9 rounded-full object-cover border border-[#D6B875]/40"
                  />
                  <span
                    className={cn(
                      'absolute bottom-0 right-0 h-2 w-2 rounded-full ring-2 ring-[#171717]',
                      activeConv.vendorAvailability === 'online'
                        ? 'bg-emerald-400'
                        : activeConv.vendorAvailability === 'away'
                        ? 'bg-amber-400'
                        : 'bg-neutral-500'
                    )}
                  />
                </div>
                <div className="min-w-0">
                  <h4
                    className="text-base font-normal text-white leading-tight truncate"
                    style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
                  >
                    {getCounterpartName(activeConv)}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {activeConv.assignedSupportAgentId ||
                    activeConv.escalatedToSupport ||
                    activeConv.status === 'escalated' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300">
                        <Headset className="h-2.5 w-2.5" />
                        {activeConv.assignedSupportAgentName
                          ? `Agent ${activeConv.assignedSupportAgentName}`
                          : 'Human Specialist'}
                      </span>
                    ) : activeConv.vendorAvailability === 'online' ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Maker Online
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#D6B875]">
                        <Bot className="h-2.5 w-2.5" /> Artis AI Active · Studio {activeConv.vendorAvailability === 'away' ? 'Away' : 'Offline'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3
                  className="text-lg font-normal text-white"
                  style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
                >
                  Artisan Studio Concierge
                </h3>
              </div>
            )}
          </div>

          {/* Minimal Icon Actions (Languages, Human Agent, Call, Close) */}
          <div className="flex items-center gap-0.5 text-[#A8A29E]">
            {activeConv && (
              <>
                {/* Language Picker Icon Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowLangMenu((v) => !v)}
                    className={cn(
                      'rounded-full p-1.5 transition-colors cursor-pointer',
                      showLangMenu || autoTranslate
                        ? 'text-[#D6B875] bg-white/10'
                        : 'text-[#A8A29E] hover:text-[#D6B875] hover:bg-white/5'
                    )}
                    title={`Translation: ${targetLanguage.toUpperCase()}`}
                  >
                    <Languages className="h-4 w-4" />
                  </button>

                  {/* Language Popover */}
                  {showLangMenu && (
                    <div className="absolute right-0 top-9 z-50 w-52 rounded-2xl border border-[#332D27] bg-[#1E1B18] p-2.5 shadow-2xl text-xs space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#2D2823] text-[11px] text-[#A8A29E]">
                        <span>Live Translate</span>
                        <button
                          onClick={() => toggleAutoTranslate()}
                          className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer',
                            autoTranslate
                              ? 'bg-[#D6B875] text-[#171717]'
                              : 'bg-white/10 text-[#A8A29E]'
                          )}
                        >
                          Auto {autoTranslate ? 'ON' : 'OFF'}
                        </button>
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-0.5">
                        {SUPPORTED_CHAT_LANGUAGES.map((l) => (
                          <button
                            key={l.code}
                            onClick={() => {
                              void setTargetLanguage(l.code);
                              setShowLangMenu(false);
                            }}
                            className={cn(
                              'w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer',
                              targetLanguage === l.code
                                ? 'bg-[#D6B875]/20 text-[#D6B875] font-semibold'
                                : 'text-[#E5E0D5] hover:bg-white/5'
                            )}
                          >
                            <span>
                              {l.flag} {l.nativeName}
                            </span>
                            <span className="text-[10px] uppercase text-[#7A756D]">{l.code}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Human Agent Escalation Icon Button */}
                <button
                  onClick={
                    activeConv.status === 'escalated' || activeConv.assignedSupportAgentId
                      ? handleSwitchToAiMode
                      : handleRequestHumanAgent
                  }
                  disabled={isEscalating}
                  className={cn(
                    'rounded-full p-1.5 transition-colors cursor-pointer',
                    activeConv.status === 'escalated' || activeConv.assignedSupportAgentId
                      ? 'text-amber-300 bg-amber-500/10'
                      : 'text-[#A8A29E] hover:text-[#D6B875] hover:bg-white/5'
                  )}
                  title={
                    activeConv.status === 'escalated'
                      ? 'Click to switch back to Artis AI Concierge'
                      : 'Connect with a Live Human Support Specialist'
                  }
                >
                  <Headset className="h-4 w-4" />
                </button>

                {/* Voice Call */}
                <button
                  onClick={() =>
                    startCall(
                      getCounterpartName(activeConv),
                      getCounterpartAvatar(activeConv),
                      false
                    )
                  }
                  className="rounded-full p-1.5 text-[#A8A29E] hover:text-[#D6B875] hover:bg-white/5 transition-colors cursor-pointer"
                  title="Voice Call"
                >
                  <Phone className="h-4 w-4" />
                </button>

                {/* Video Call */}
                <button
                  onClick={() =>
                    startCall(
                      getCounterpartName(activeConv),
                      getCounterpartAvatar(activeConv),
                      true
                    )
                  }
                  className="rounded-full p-1.5 text-[#A8A29E] hover:text-[#D6B875] hover:bg-white/5 transition-colors cursor-pointer"
                  title="Video Call"
                >
                  <Video className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Close Drawer */}
            <button
              onClick={() => toggleDrawer(false)}
              className="rounded-full p-1.5 text-[#A8A29E] hover:text-white hover:bg-white/5 transition-colors cursor-pointer ml-1"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── 2. ACTIVE CONVERSATION BODY ──────────────────────────── */}
        {activeConversationId ? (
          <div className="flex flex-1 flex-col overflow-hidden bg-[#171717]">
            {/* Linked Product Bar (Clean & Minimal) */}
            {activeConv?.productTitle && (
              <div className="flex items-center justify-between border-b border-[#26221D] bg-[#1E1B18]/95 px-4 py-2 text-xs">
                <div className="flex items-center gap-2.5 truncate text-[#E5E0D5]">
                  {activeConv.productImage &&
                  !activeConv.productImage.endsWith('.glb') &&
                  !activeConv.productImage.endsWith('.gltf') ? (
                    <img
                      src={activeConv.productImage}
                      alt=""
                      className="h-8 w-8 rounded-lg object-cover border border-[#D6B875]/30 shrink-0"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-lg bg-[#2A241F] border border-[#D6B875]/30 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-[#D6B875]" />
                    </div>
                  )}
                  <span
                    className="truncate font-normal text-white text-[13px]"
                    style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
                  >
                    {activeConv.productTitle}
                  </span>
                </div>
                {activeConv.productId && (
                  <button
                    onClick={() => {
                      navigate(`/shop/products/${activeConv.productId}`);
                      toggleDrawer(false);
                    }}
                    className="flex items-center gap-1 font-medium text-[#D6B875] hover:text-white shrink-0 text-[11px] ml-2 transition-colors cursor-pointer"
                  >
                    <span>View</span> <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}

            {/* Messages Scroll Area with Chat Background Wallpaper */}
            <div
              style={WHATSAPP_DARK_BG_STYLE}
              className="flex-1 overflow-y-auto p-4 space-y-1"
            >
              {activeMsgs.length === 0 ? (
                <div className="flex h-3/4 flex-col items-center justify-center text-center p-6">
                  <div className="rounded-3xl bg-[#171717]/92 backdrop-blur-md border border-[#D6B875]/30 p-6 shadow-xl max-w-[280px] text-center space-y-2">
                    <div className="h-10 w-10 rounded-2xl bg-[#D6B875]/15 border border-[#D6B875]/30 flex items-center justify-center mx-auto text-[#D6B875]">
                      {activeConv.vendorAvailability === 'online' ? (
                        <Store className="h-5 w-5" />
                      ) : (
                        <Bot className="h-5 w-5" />
                      )}
                    </div>
                    <h4
                      className="text-lg font-normal text-white pt-1"
                      style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
                    >
                      {activeConv.vendorAvailability === 'online'
                        ? 'Artisan Studio Direct'
                        : 'Artis AI Concierge'}
                    </h4>
                    <p className="text-xs text-[#A8A29E] leading-relaxed">
                      {activeConv.vendorAvailability === 'online'
                        ? `Direct dialogue with ${activeConv?.vendorBusinessName || 'the studio'}. The maker is currently live on the website.`
                        : `The maker is away from the studio. Artis AI is active to assist with specs, craftsmanship, and policies.`}
                    </p>
                    <div className="pt-2 text-[10px] text-[#D6B875] flex items-center justify-center gap-1 font-medium">
                      <CheckCircle2 className="h-3 w-3" />{' '}
                      {activeConv.vendorAvailability === 'online'
                        ? 'Verified Master Artisan'
                        : 'Grounded in Studio Policies'}
                    </div>
                  </div>
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
              placeholder={
                activeConv.vendorAvailability === 'online'
                  ? 'Message the artisan directly...'
                  : 'Ask Artis AI about dimensions, shipping...'
              }
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
          /* ── 3. CONVERSATIONS LIST VIEW (CLEAN & MINIMAL) ───────── */
          <div className="flex flex-1 flex-col overflow-hidden bg-[#171717]">
            <div className="p-3 border-b border-[#26221D] bg-[#171717]">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#7A756D]" />
                <input
                  type="text"
                  placeholder="Search studios or creations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-full bg-[#24201C] border border-[#332D27] pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-[#7A756D] focus:border-[#D6B875] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#26221D]">
              {!user ? (
                <div className="p-8 text-center text-[#A8A29E] space-y-3">
                  <LogIn className="h-10 w-10 mx-auto text-[#D6B875] opacity-80" />
                  <p
                    className="text-base text-white font-normal"
                    style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
                  >
                    Sign in to message master artisans
                  </p>
                  <p className="text-xs text-[#A8A29E]">
                    Connect directly with verified studios worldwide, ask questions, and request bespoke quotes.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      toggleDrawer(false);
                      navigate('/auth');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#D6B875] px-5 py-2 text-xs font-bold text-[#171717] hover:bg-[#C5A45E] transition-colors cursor-pointer"
                  >
                    <LogIn className="h-3.5 w-3.5" /> Sign In / Register
                  </button>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-[#A8A29E]">
                  <MessageSquare className="h-10 w-10 mx-auto text-[#D6B875] mb-2 opacity-60" />
                  <p
                    className="text-base text-white font-normal"
                    style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
                  >
                    No studio chats yet
                  </p>
                  <p className="text-xs text-[#A8A29E] mt-1">
                    Click &quot;Chat&quot; on any creation to open an instant dialogue with the artisan.
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
                      className="flex w-full items-center gap-3 p-3.5 text-left bg-[#171717] hover:bg-[#201C18] transition-colors cursor-pointer"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={getCounterpartAvatar(c)}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover border border-[#D6B875]/30"
                        />
                        <span
                          className={cn(
                            'absolute bottom-0 right-0 h-2 w-2 rounded-full ring-2 ring-[#171717]',
                            c.status === 'escalated' ? 'bg-amber-400' : 'bg-[#D6B875]'
                          )}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className="font-normal text-sm text-white truncate"
                            style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
                          >
                            {getCounterpartName(c)}
                          </h4>
                          {c.lastMessage && (
                            <span className="text-[10px] text-[#7A756D] shrink-0">
                              {new Date(c.lastMessage.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5">
                          {c.productTitle && (
                            <span className="text-[11px] font-medium text-[#D6B875] truncate">
                              {c.productTitle}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#A8A29E] truncate mt-0.5">
                          {c.lastMessage?.text || 'No messages yet'}
                        </p>
                      </div>

                      {unread > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D6B875] text-[10px] font-bold text-[#171717] shrink-0">
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
