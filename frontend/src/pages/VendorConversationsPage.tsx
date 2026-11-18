import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MessageSquare,
  Bot,
  User,
  AlertCircle,
  Search,
  Languages,
  DollarSign,
  Package,
  Phone,
  Video,
  Headset,
  CheckCircle2,
  Sparkles,
  Loader2,
  X,
  Mail,
  MapPin,
  ShoppingBag,
  ChevronLeft,
} from 'lucide-react';
import { Product, SUPPORTED_CHAT_LANGUAGES } from '@convocart/shared';
import { useChatStore } from '../stores/useChatStore';
import { useAuthStore } from '../stores/useAuthStore';
import { apiRequest } from '../lib/api';
import { MessageBubble } from '../features/chat/MessageBubble';
import { MessageComposer } from '../features/chat/MessageComposer';
import { WHATSAPP_DARK_BG_STYLE } from '../features/chat/whatsappWallpaper';
import { cn, formatCurrency, formatDate } from '../lib/utils';

type FilterTab = 'all' | 'ai' | 'human' | 'escalated';

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

export const VendorConversationsPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    messages,
    targetLanguage,
    autoTranslate,
    isTranslating,
    fetchConversations,
    refreshActiveMessages,
    selectConversation,
    sendMessage,
    sendPaymentRequest,
    updateConversationSettings,
    setTargetLanguage,
    toggleAutoTranslate,
    translateAllInConversation,
    escalateConversation,
    dispatchConversation,
    startCall,
  } = useChatStore();

  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [showPaymentBuilder, setShowPaymentBuilder] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [payAmount, setPayAmount] = useState('149.00');
  const [payTitle, setPayTitle] = useState('Bespoke Store Deal');
  const [payOrderId, setPayOrderId] = useState('');
  const [isUpdatingMode, setIsUpdatingMode] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetchConversations();
    const vendorId = user?.vendorId;
    if (vendorId) {
      apiRequest<{ products?: Product[] } | Product[]>(`/products?vendorId=${vendorId}`)
        .then((res) => {
          const items = Array.isArray(res) ? res : res?.products || [];
          setVendorProducts(items);
        })
        .catch(() => setVendorProducts([]));
    }
    const interval = setInterval(() => {
      void fetchConversations();
      void refreshActiveMessages();
    }, 1800);
    return () => clearInterval(interval);
  }, [user?.vendorId]);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter((c) => {
      if (filter === 'ai' && !c.aiHandlingEnabled) return false;
      if (filter === 'human' && (c.aiHandlingEnabled || c.status === 'escalated' || c.escalatedToSupport)) {
        return false;
      }
      if (filter === 'escalated' && c.status !== 'escalated' && !c.escalatedToSupport) return false;
      if (!q) return true;
      return (
        c.consumerName.toLowerCase().includes(q) ||
        (c.productTitle || '').toLowerCase().includes(q) ||
        (c.lastMessage?.text || '').toLowerCase().includes(q) ||
        (c.assignedSupportAgentName || '').toLowerCase().includes(q)
      );
    });
  }, [conversations, filter, search]);

  const activeConv =
    conversations.find((c) => c.conversationId === activeConversationId) || filteredConversations[0];
  const activeMsgs = activeConv ? messages[activeConv.conversationId] || [] : [];

  useEffect(() => {
    if (activeConv && activeConv.conversationId !== activeConversationId) {
      void selectConversation(activeConv.conversationId, false);
    }
  }, [activeConv?.conversationId, activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMsgs.length]);

  const handleToggleAiMode = async () => {
    if (!activeConv || isUpdatingMode) return;
    setIsUpdatingMode(true);
    try {
      await updateConversationSettings(activeConv.conversationId, {
        aiHandlingEnabled: !activeConv.aiHandlingEnabled,
      });
    } finally {
      setIsUpdatingMode(false);
    }
  };

  const handleSendProductCard = async (product: Product) => {
    if (!activeConv) return;
    const effectivePrice =
      product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price;
    await sendMessage(
      `Recommended product: ${product.title}`,
      'product_card',
      undefined,
      {
        productId: product.productId,
        productTitle: product.title,
        productPrice: Number(effectivePrice.toFixed(2)),
        productImage: product.images?.[0],
      },
      activeConv.conversationId
    );
    setShowProductPicker(false);
  };

  const handleSendPaymentCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv) return;
    const amt = parseFloat(payAmount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    await sendPaymentRequest(
      activeConv.conversationId,
      amt,
      payTitle.trim() || `Custom Store Payment (${formatCurrency(amt)})`,
      payOrderId.trim() || activeConv.orderId
    );
    setShowPaymentBuilder(false);
  };

  const handleEscalate = async () => {
    if (!activeConv) return;
    await escalateConversation(
      activeConv.conversationId,
      'Seller escalated buyer thread to Human Support Dispatch Center'
    );
  };

  const handleResolve = async () => {
    if (!activeConv) return;
    await dispatchConversation(activeConv.conversationId, { action: 'resolve' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900">
            Seller Messaging & Live Deal Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            1-on-1 buyer chat, AI Concierge vs Live Seller Takeover, instant quotes, and multilingual translation.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 overflow-x-auto max-w-full">
          {(
            [
              { id: 'all', label: `All (${conversations.length})` },
              {
                id: 'ai',
                label: `AI Handled (${conversations.filter((c) => c.aiHandlingEnabled).length})`,
              },
              {
                id: 'human',
                label: `Live Seller (${
                  conversations.filter(
                    (c) => !c.aiHandlingEnabled && c.status !== 'escalated' && !c.escalatedToSupport
                  ).length
                })`,
              },
              {
                id: 'escalated',
                label: `Escalated (${
                  conversations.filter((c) => c.status === 'escalated' || c.escalatedToSupport).length
                })`,
              },
            ] as { id: FilterTab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                'rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors shrink-0',
                filter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* LEFT PANE: Filterable Conversations */}
        <div
          className={cn(
            'lg:col-span-4 flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs min-h-0',
            mobileView === 'chat' ? 'hidden lg:flex' : 'flex'
          )}
        >
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search buyer, product, or agent..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs focus:border-brand-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">No matching conversations</p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = activeConv?.conversationId === c.conversationId;
                const unread =
                  (user ? c.unreadCount?.[user.uid] || 0 : 0) +
                  (user?.vendorId && user.vendorId !== user.uid
                    ? c.unreadCount?.[user.vendorId] || 0
                    : 0);
                return (
                  <button
                    key={c.conversationId}
                    onClick={() => {
                      void selectConversation(c.conversationId, false);
                      setMobileView('chat');
                    }}
                    className={cn(
                      'w-full text-left p-3.5 transition-colors flex items-start gap-3',
                      isSelected ? 'bg-brand-50/70 border-l-4 border-l-brand-600' : 'hover:bg-slate-50'
                    )}
                  >
                    <img
                      src={c.consumerAvatar || FALLBACK_AVATAR}
                      alt={c.consumerName}
                      className="h-10 w-10 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {c.consumerName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatDate(c.updatedAt)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {c.status === 'escalated' || c.escalatedToSupport ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                            <AlertCircle className="h-2.5 w-2.5" />
                            {c.assignedSupportAgentName || 'Dispatch'}
                          </span>
                        ) : c.aiHandlingEnabled ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#171717] px-1.5 py-0.5 text-[9px] font-bold text-[#D6B875]">
                            <Bot className="h-2.5 w-2.5" /> AI Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#ECEAE4] border border-[#E4DEC8] px-1.5 py-0.5 text-[9px] font-bold text-[#171717]">
                            <User className="h-2.5 w-2.5" /> Seller Live
                          </span>
                        )}
                        {c.consumerPreferredLanguage && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-600">
                            {c.consumerPreferredLanguage}
                          </span>
                        )}
                        {unread > 0 && (
                          <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                            {unread}
                          </span>
                        )}
                      </div>

                      {c.productTitle && (
                        <p className="text-[10px] font-semibold text-brand-700 truncate mt-1">
                          {c.productTitle}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {c.lastMessage?.text || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Full Interactive Seller Chat & Deal Workspace */}
        <div
          className={cn(
            'lg:col-span-8 flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs min-h-0',
            mobileView === 'list' ? 'hidden lg:flex' : 'flex'
          )}
        >
          {activeConv ? (
            <>
              {/* Active Conversation Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileView('list')}
                    className="lg:hidden rounded-lg p-1.5 text-slate-600 hover:bg-slate-200 cursor-pointer -ml-1 mr-0.5"
                    title="Back to conversation list"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <img
                    src={activeConv.consumerAvatar || FALLBACK_AVATAR}
                    alt={activeConv.consumerName}
                    className="h-9 w-9 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 truncate">
                        {activeConv.consumerName}
                      </h3>
                      <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                        Lang: {activeConv.consumerPreferredLanguage || 'en'}
                      </span>
                      {typeof activeConv.consumerTotalOrders === 'number' && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          <ShoppingBag className="h-2.5 w-2.5" />
                          {activeConv.consumerTotalOrders} order{activeConv.consumerTotalOrders === 1 ? '' : 's'} •{' '}
                          {formatCurrency(activeConv.consumerTotalSpent || 0)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
                      {activeConv.consumerEmail && (
                        <span className="inline-flex items-center gap-1 truncate max-w-[200px]">
                          <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                          {activeConv.consumerEmail}
                        </span>
                      )}
                      {activeConv.consumerPhone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                          {activeConv.consumerPhone}
                        </span>
                      )}
                      {activeConv.consumerAddressSummary && (
                        <span className="inline-flex items-center gap-1 truncate max-w-[220px]">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          {activeConv.consumerAddressSummary}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {activeConv.productTitle || activeConv.vendorBusinessName}
                      {activeConv.assignedSupportAgentName
                        ? ` • Dispatch Agent: ${activeConv.assignedSupportAgentName}`
                        : ''}
                    </p>
                  </div>
                </div>

                {/* Seller Controls */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={handleToggleAiMode}
                    disabled={isUpdatingMode}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold border transition-colors',
                      activeConv.aiHandlingEnabled
                        ? 'bg-[#171717] text-[#D6B875] border-[#171717]'
                        : 'bg-[#ECEAE4] text-[#171717] border-[#E4DEC8] hover:bg-[#E4DEC8]'
                    )}
                    title="Switch between AI Concierge auto-reply and direct Human Seller mode"
                  >
                    {activeConv.aiHandlingEnabled ? (
                      <>
                        <Bot className="h-3.5 w-3.5" /> AI Mode ON
                      </>
                    ) : (
                      <>
                        <User className="h-3.5 w-3.5" /> Live Takeover
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setShowPaymentBuilder((v) => !v);
                      setShowProductPicker(false);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700"
                  >
                    <DollarSign className="h-3.5 w-3.5" /> Payment Request
                  </button>

                  <button
                    onClick={() => {
                      setShowProductPicker((v) => !v);
                      setShowPaymentBuilder(false);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                  >
                    <Package className="h-3.5 w-3.5" /> Share Product
                  </button>

                  {activeConv.status === 'escalated' || activeConv.escalatedToSupport ? (
                    <button
                      onClick={handleResolve}
                      className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                    </button>
                  ) : (
                    <button
                      onClick={handleEscalate}
                      className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100"
                    >
                      <Headset className="h-3.5 w-3.5" /> Escalate
                    </button>
                  )}

                  <button
                    onClick={() => startCall(activeConv.consumerName, activeConv.consumerAvatar, false)}
                    className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100"
                    title="Voice Call"
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => startCall(activeConv.consumerName, activeConv.consumerAvatar, true)}
                    className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100"
                    title="Video Call"
                  >
                    <Video className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Translation Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 px-4 py-1.5 text-[11px] text-slate-200">
                <div className="flex items-center gap-2">
                  <Languages className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Translate view to:</span>
                  <select
                    value={targetLanguage}
                    onChange={(e) => void setTargetLanguage(e.target.value)}
                    className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] text-white"
                  >
                    {SUPPORTED_CHAT_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flag} {l.nativeName}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => void toggleAutoTranslate()}
                    className={cn(
                      'rounded px-2 py-0.5 text-[10px] font-bold border',
                      autoTranslate
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    )}
                  >
                    Auto-Translate {autoTranslate ? 'ON' : 'OFF'}
                  </button>
                </div>

                <button
                  onClick={() => void translateAllInConversation(activeConv.conversationId, targetLanguage)}
                  disabled={isTranslating}
                  className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-sky-300 hover:bg-slate-700"
                >
                  {isTranslating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Translate Entire Thread
                </button>
              </div>

              {/* Payment Request Builder Drawer */}
              {showPaymentBuilder && (
                <form
                  onSubmit={handleSendPaymentCard}
                  className="flex flex-wrap items-end gap-2 border-b border-emerald-200 bg-emerald-50/70 px-4 py-3"
                >
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-[10px] font-bold uppercase text-emerald-900 mb-1">
                      Offer / Invoice Description
                    </label>
                    <input
                      type="text"
                      value={payTitle}
                      onChange={(e) => setPayTitle(e.target.value)}
                      className="w-full rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none"
                      required
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-[10px] font-bold uppercase text-emerald-900 mb-1">
                      Amount (USD)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none"
                      required
                    />
                  </div>
                  <div className="w-36">
                    <label className="block text-[10px] font-bold uppercase text-emerald-900 mb-1">
                      Order ID (optional)
                    </label>
                    <input
                      type="text"
                      value={payOrderId}
                      onChange={(e) => setPayOrderId(e.target.value)}
                      placeholder="ord_..."
                      className="w-full rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Send Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentBuilder(false)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </form>
              )}

              {/* Store Product Card Picker */}
              {showProductPicker && (
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-700">
                      Click a product to embed its interactive card in chat:
                    </span>
                    <button
                      onClick={() => setShowProductPicker(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {vendorProducts.length === 0 ? (
                      <span className="text-xs text-slate-400">No store products loaded.</span>
                    ) : (
                      vendorProducts.map((p) => (
                        <button
                          key={p.productId}
                          onClick={() => void handleSendProductCard(p)}
                          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-left hover:border-brand-500 shrink-0"
                        >
                          {p.images?.[0] && (
                            <img src={p.images[0]} alt="" className="h-7 w-7 rounded object-cover" />
                          )}
                          <div>
                            <p className="text-[11px] font-bold text-slate-900 max-w-[140px] truncate">
                              {p.title}
                            </p>
                            <p className="text-[10px] font-semibold text-emerald-700">
                              {formatCurrency(p.price)} • {p.stock} in stock
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Message Thread */}
              <div
                style={WHATSAPP_DARK_BG_STYLE}
                className="flex-1 overflow-y-auto p-4 space-y-1.5"
              >
                {activeMsgs.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    isMe={m.senderId === user?.uid}
                    targetLanguage={targetLanguage}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              <MessageComposer
                conversationId={activeConv.conversationId}
                onSendMessage={(text, type, mediaUrl, metadata) =>
                  sendMessage(text, type, mediaUrl, metadata, activeConv.conversationId)
                }
                targetLanguage={targetLanguage}
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-10 text-slate-400">
              <MessageSquare className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-sm font-bold text-slate-700">Select a conversation</p>
              <p className="text-xs mt-1">
                Pick any buyer inquiry on the left to chat, toggle AI Concierge, or send payment offers.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
