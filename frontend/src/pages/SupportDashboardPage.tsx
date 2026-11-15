import React, { useEffect, useRef, useState } from 'react';
import { apiRequest } from '../lib/api';
import {
  Conversation,
  DispatchAgentInfo,
  DispatchOverviewStats,
  SUPPORTED_CHAT_LANGUAGES,
  SupportTicket,
  TicketStatus,
} from '@convocart/shared';
import { formatDate, cn } from '../lib/utils';
import { useChatStore } from '../stores/useChatStore';
import { useAuthStore } from '../stores/useAuthStore';
import { MessageBubble } from '../features/chat/MessageBubble';
import { MessageComposer } from '../features/chat/MessageComposer';
import { WHATSAPP_DARK_BG_STYLE } from '../features/chat/whatsappWallpaper';
import { AdminSupportCommandCenter } from '../features/support/AdminSupportCommandCenter';
import {
  Headphones,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  UserCheck,
  Send,
  Lock,
  Sparkles,
  Languages,
  Users,
  Store,
  RefreshCw,
  Phone,
  Video,
  Headset,
  Clock,
  BookOpen,
} from 'lucide-react';

interface DispatchOverviewResponse {
  stats: DispatchOverviewStats;
  escalatedConversations: Conversation[];
  agents: DispatchAgentInfo[];
}

export const SupportDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    activeConversationId,
    messages,
    targetLanguage,
    autoTranslate,
    selectConversation,
    sendMessage,
    setTargetLanguage,
    toggleAutoTranslate,
    dispatchConversation,
    startCall,
  } = useChatStore();

  const [activeTab, setActiveTab] = useState<'dispatch' | 'tickets' | 'command' | 'agents'>('dispatch');
  const [overview, setOverview] = useState<DispatchOverviewResponse | null>(null);
  const [queueFilter, setQueueFilter] = useState<'all' | 'waiting' | 'assigned' | 'multilingual'>('all');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedAgentAssign, setSelectedAgentAssign] = useState<string>('');
  const [isDispatching, setIsDispatching] = useState(false);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newInternalNote, setNewInternalNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [dispatchData, ticketData] = await Promise.all([
        apiRequest<DispatchOverviewResponse>('/support/dispatch-overview'),
        apiRequest<SupportTicket[]>('/support/tickets'),
      ]);
      setOverview(dispatchData);
      setTickets(ticketData);

      if (ticketData.length > 0 && !activeTicketId) {
        setActiveTicketId(ticketData[0].ticketId);
      }

      if (dispatchData.escalatedConversations.length > 0 && !selectedConvId) {
        const firstId = dispatchData.escalatedConversations[0].conversationId;
        setSelectedConvId(firstId);
        await selectConversation(firstId, false);
      }
    } catch (err) {
      console.error('Failed to load dispatch center data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const timer = setInterval(() => {
      apiRequest<DispatchOverviewResponse>('/support/dispatch-overview')
        .then(setOverview)
        .catch(() => {});
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectDispatchConv = async (convId: string) => {
    setSelectedConvId(convId);
    await selectConversation(convId, false);
  };

  const activeConv =
    overview?.escalatedConversations.find((c) => c.conversationId === selectedConvId) ||
    overview?.escalatedConversations[0];
  const activeConvMessages = activeConv ? messages[activeConv.conversationId] || [] : [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConvMessages.length, selectedConvId]);

  const handleDispatchAction = async (
    action: 'claim' | 'auto' | 'transfer_vendor' | 'resolve',
    agentId?: string
  ) => {
    if (!activeConv || isDispatching) return;
    setIsDispatching(true);
    try {
      await dispatchConversation(activeConv.conversationId, { action, agentId });
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Dispatch action failed');
    } finally {
      setIsDispatching(false);
    }
  };

  const activeTicket = tickets.find((t) => t.ticketId === activeTicketId);

  const handleAssignToMe = async (ticketId: string) => {
    try {
      await apiRequest(`/support/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ assignToMe: true, status: 'in_progress' }),
      });
      await fetchAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateStatus = async (ticketId: string, nextStatus: TicketStatus) => {
    try {
      await apiRequest(`/support/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      await fetchAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !newInternalNote.trim()) return;

    try {
      await apiRequest(`/support/tickets/${activeTicket.ticketId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note: newInternalNote.trim() }),
      });
      setNewInternalNote('');
      await fetchAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredConversations = (overview?.escalatedConversations || []).filter((c) => {
    if (queueFilter === 'waiting') {
      return (c.status === 'escalated' || c.escalatedToSupport) && !c.assignedSupportAgentId;
    }
    if (queueFilter === 'assigned') {
      return Boolean(c.assignedSupportAgentId);
    }
    if (queueFilter === 'multilingual') {
      return (
        c.autoTranslateEnabled ||
        (c.consumerPreferredLanguage && c.consumerPreferredLanguage !== 'en') ||
        c.consumerPreferredLanguage !== c.vendorPreferredLanguage
      );
    }
    return true;
  });

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  const stats = overview?.stats;
  const supportAgents = (overview?.agents || []).filter((a) => a.role === 'support_agent');

  return (
    <div className="space-y-6">
      {/* Top Header + Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
              <Headset className="h-3 w-3" /> Live Human Agent Dispatch Center
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
              <Languages className="h-3 w-3" /> Nexconn Multilingual Sync
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1.5">
            Marketplace Support & Dispatch Command
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Route escalated buyer-seller conversations to live specialists, intervene in any language, and resolve SLA tickets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-slate-200/70 p-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('dispatch')}
              className={cn(
                'rounded-lg px-3.5 py-1.5 flex items-center gap-1.5 transition-all',
                activeTab === 'dispatch' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" /> Live Dispatch Queue
              {(stats?.waitingInQueueCount || 0) > 0 && (
                <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] text-white">
                  {stats?.waitingInQueueCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={cn(
                'rounded-lg px-3.5 py-1.5 flex items-center gap-1.5 transition-all',
                activeTab === 'tickets' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
              )}
            >
              <Clock className="h-3.5 w-3.5" /> Ticket Queues ({tickets.length})
            </button>
            <button
              onClick={() => setActiveTab('command')}
              className={cn(
                'rounded-lg px-3.5 py-1.5 flex items-center gap-1.5 transition-all',
                activeTab === 'command' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
              )}
            >
              <BookOpen className="h-3.5 w-3.5" /> Support, FAQs &amp; KB
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={cn(
                'rounded-lg px-3.5 py-1.5 flex items-center gap-1.5 transition-all',
                activeTab === 'agents' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
              )}
            >
              <Users className="h-3.5 w-3.5" /> Agent Roster ({overview?.agents.length || 0})
            </button>
          </div>

          <button
            onClick={fetchAllData}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            title="Refresh live telemetry"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} /> Sync
          </button>
        </div>
      </div>

      {/* Real-time Telemetry Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Waiting Dispatch</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {stats?.waitingInQueueCount ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {stats?.escalatedChatsCount ?? 0} total escalated threads
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Active Agent Chats</span>
            <Headphones className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {stats?.activeDispatchedCount ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {stats?.onlineAgentsCount ?? 0} specialists online now
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Cross-Language Chats</span>
            <Languages className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {stats?.multiLanguageChatsCount ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Auto-translated 1-on-1 & 3-way threads
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Resolved & Avg SLA</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {stats?.resolvedTodayCount ?? 0}{' '}
            <span className="text-xs font-semibold text-slate-500">
              / {stats?.avgSlaHours ?? 12}h SLA
            </span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Real-time SLA compliance</p>
        </div>
      </div>

      {/* TAB 1: LIVE HUMAN AGENT DISPATCH QUEUE & CONSOLE */}
      {activeTab === 'dispatch' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Queue List */}
          <div className="lg:col-span-4 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[660px]">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Dispatch Queue ({filteredConversations.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'waiting', label: 'Unassigned' },
                  { id: 'assigned', label: 'Active Agent' },
                  { id: 'multilingual', label: 'Multilingual' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setQueueFilter(f.id as any)}
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors',
                      queueFilter === f.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No conversations match this dispatch filter.
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isSelected = activeConv?.conversationId === c.conversationId;
                  const isWaiting =
                    (c.status === 'escalated' || c.escalatedToSupport) && !c.assignedSupportAgentId;
                  const buyerLang = SUPPORTED_CHAT_LANGUAGES.find(
                    (l) => l.code === c.consumerPreferredLanguage
                  );
                  return (
                    <button
                      key={c.conversationId}
                      onClick={() => handleSelectDispatchConv(c.conversationId)}
                      className={cn(
                        'w-full p-4 text-left transition-colors',
                        isSelected
                          ? 'bg-blue-50/80 border-l-4 border-blue-600'
                          : 'hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {c.consumerName}
                        </span>
                        {isWaiting ? (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-700 shrink-0">
                            Needs Agent
                          </span>
                        ) : c.assignedSupportAgentName ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 shrink-0">
                            {c.assignedSupportAgentName}
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 shrink-0">
                            {c.aiHandlingEnabled ? 'AI Active' : 'Seller'}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] font-semibold text-slate-700 truncate">
                        🏪 {c.vendorBusinessName}
                        {c.productTitle ? ` • ${c.productTitle}` : ''}
                      </p>

                      {c.escalationReason && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 mt-1 line-clamp-1">
                          ⚠ {c.escalationReason}
                        </p>
                      )}

                      <p className="text-[11px] text-slate-500 truncate mt-1">
                        {c.lastMessage?.text || 'No messages yet'}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                        <span>
                          Buyer: {buyerLang?.flag || '🌐'}{' '}
                          {(c.consumerPreferredLanguage || 'en').toUpperCase()}
                        </span>
                        <span>{formatDate(c.updatedAt)}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Embedded Live Intervention & Translated Chat Console */}
          <div className="lg:col-span-8 rounded-3xl border border-slate-200 bg-[#111b21] shadow-sm overflow-hidden flex flex-col h-[660px]">
            {activeConv ? (
              <>
                {/* Dispatch Control Header */}
                <div className="border-b border-[#222d34] bg-[#202c33] px-4 py-3 text-[#e9edef] space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-white truncate">
                          {activeConv.consumerName} ↔ {activeConv.vendorBusinessName}
                        </h3>
                        <span className="rounded bg-[#2a3942] px-2 py-0.5 text-[10px] font-bold text-[#53bdeb]">
                          Buyer: {(activeConv.consumerPreferredLanguage || 'en').toUpperCase()} → Seller:{' '}
                          {(activeConv.vendorPreferredLanguage || 'en').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8696a0] mt-0.5 truncate">
                        {activeConv.escalationReason ||
                          (activeConv.productTitle
                            ? `Topic: ${activeConv.productTitle}`
                            : '1-on-1 Marketplace Support Stream')}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => startCall(activeConv.consumerName, activeConv.consumerAvatar, false)}
                        className="rounded-lg bg-[#2a3942] p-2 text-[#d1d7db] hover:text-white"
                        title="Voice Call Consumer"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => startCall(activeConv.consumerName, activeConv.consumerAvatar, true)}
                        className="rounded-lg bg-[#2a3942] p-2 text-[#d1d7db] hover:text-white"
                        title="Video Call Consumer"
                      >
                        <Video className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Action Bar: Auto-Dispatch, Claim, Route to Specific Agent, Transfer Seller, Resolve, Language */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#2a3942]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => handleDispatchAction('auto')}
                        disabled={isDispatching}
                        className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 text-[11px] font-bold text-white flex items-center gap-1"
                        title="Match best available agent by language & load"
                      >
                        <Sparkles className="h-3 w-3" /> Auto-Dispatch
                      </button>

                      <button
                        onClick={() => handleDispatchAction('claim', user?.uid)}
                        disabled={isDispatching}
                        className="rounded-lg bg-[#00a884] hover:bg-[#029676] px-2.5 py-1 text-[11px] font-bold text-[#111b21] flex items-center gap-1"
                      >
                        <UserCheck className="h-3 w-3" /> Claim & Join
                      </button>

                      <div className="flex items-center gap-1">
                        <select
                          value={selectedAgentAssign}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedAgentAssign(val);
                            if (val) handleDispatchAction('claim', val);
                          }}
                          className="rounded-lg bg-[#2a3942] border border-[#364752] px-2 py-1 text-[11px] text-[#e9edef]"
                        >
                          <option value="">Assign Specialist...</option>
                          {supportAgents.map((ag) => (
                            <option key={ag.uid} value={ag.uid}>
                              {ag.displayName} ({ag.preferredLanguage.toUpperCase()} • {ag.activeChats}{' '}
                              chats)
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => handleDispatchAction('transfer_vendor')}
                        disabled={isDispatching}
                        className="rounded-lg bg-[#2a3942] hover:bg-[#364752] px-2.5 py-1 text-[11px] font-bold text-[#d1d7db] flex items-center gap-1"
                      >
                        <Store className="h-3 w-3" /> To Seller
                      </button>

                      <button
                        onClick={() => handleDispatchAction('resolve')}
                        disabled={isDispatching}
                        className="rounded-lg bg-emerald-600/25 border border-emerald-500/40 hover:bg-emerald-600/40 px-2.5 py-1 text-[11px] font-bold text-emerald-300 flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" /> Resolve
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="rounded bg-[#111b21] border border-[#2a3942] px-2 py-1 text-[11px] text-[#e9edef]"
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
                          'rounded px-2 py-1 text-[11px] font-bold border',
                          autoTranslate
                            ? 'bg-[#00a884]/20 border-[#00a884]/50 text-[#00a884]'
                            : 'bg-[#111b21] border-[#2a3942] text-[#8696a0]'
                        )}
                      >
                        Auto-Translate {autoTranslate ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chat Transcript Stream */}
                <div style={WHATSAPP_DARK_BG_STYLE} className="flex-1 overflow-y-auto p-4 space-y-1">
                  {activeConvMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-[#8696a0]">
                      Loading Nexconn conversation stream...
                    </div>
                  ) : (
                    activeConvMessages.map((m) => (
                      <MessageBubble
                        key={m.id}
                        message={m}
                        isMe={m.senderId === user?.uid}
                        targetLanguage={targetLanguage}
                      />
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Embedded Multi-Language Agent Reply Composer */}
                <MessageComposer
                  onSendMessage={async (text, type, mediaUrl, metadata) => {
                    if (activeConversationId !== activeConv.conversationId) {
                      await selectConversation(activeConv.conversationId, false);
                    }
                    await sendMessage(text, type, mediaUrl, metadata);
                    await fetchAllData();
                  }}
                  targetLanguage={targetLanguage}
                  quickActions={[
                    {
                      label: 'Send Refund Approval Update',
                      onClick: () =>
                        sendMessage(
                          '✅ Human Dispatch Update: I have reviewed your request and authorized priority assistance on this order.',
                          'text'
                        ),
                    },
                  ]}
                />
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#8696a0] p-8 text-center">
                <Headphones className="h-10 w-10 text-[#00a884] mb-3 opacity-70" />
                <p className="text-sm font-bold text-white">Select an escalated or active chat</p>
                <p className="text-xs mt-1 max-w-sm">
                  Dispatch an available human agent or join any multilingual buyer-seller stream directly from this console.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SUPPORT TICKET QUEUE & SLA TRIAGE */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Ticket Queues & SLA Tracking</h2>
            <div className="flex rounded-xl bg-slate-200/60 p-1 text-xs font-semibold">
              {['all', 'open', 'in_progress', 'resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    'rounded-lg px-3 py-1 capitalize transition-colors',
                    statusFilter === st ? 'bg-white shadow text-slate-900' : 'text-slate-600'
                  )}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-600">
                Inbox ({filteredTickets.length} Tickets)
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {filteredTickets.map((t) => {
                  const isSelected = activeTicketId === t.ticketId;
                  return (
                    <div
                      key={t.ticketId}
                      onClick={() => setActiveTicketId(t.ticketId)}
                      className={cn(
                        'p-4 cursor-pointer transition-colors',
                        isSelected ? 'bg-brand-50/70 border-l-4 border-brand-600' : 'hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className="font-bold text-slate-900 truncate max-w-[150px]">
                          {t.consumerName}
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase',
                            t.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-700'
                              : t.priority === 'high'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          )}
                        >
                          {t.priority}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-800 truncate">{t.subject}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">{t.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                        <span>{t.category}</span>
                        <span>{formatDate(t.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col h-[600px] overflow-y-auto space-y-6">
              {activeTicket ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          #{activeTicket.ticketId}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold capitalize text-slate-700">
                          {activeTicket.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-slate-900">{activeTicket.subject}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Filed by {activeTicket.consumerName} ({activeTicket.consumerEmail}) • SLA:{' '}
                        {activeTicket.slaDueHours}h
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!activeTicket.assignedAgentId && (
                        <button
                          onClick={() => handleAssignToMe(activeTicket.ticketId)}
                          className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-600 flex items-center gap-1.5"
                        >
                          <UserCheck className="h-3.5 w-3.5" /> Assign to Me
                        </button>
                      )}

                      {activeTicket.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateStatus(activeTicket.ticketId, 'resolved')}
                          className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                    <span className="font-bold text-slate-900 block mb-1">Customer Description:</span>
                    {activeTicket.description}
                  </div>

                  {activeTicket.conversationId && (
                    <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-4 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 block">
                          Linked Customer Conversation
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          Jump straight into the live translated dispatch stream.
                        </span>
                      </div>
                      <button
                        onClick={async () => {
                          await handleSelectDispatchConv(activeTicket.conversationId!);
                          setActiveTab('dispatch');
                        }}
                        className="rounded-xl bg-brand-600 px-4 py-2 font-bold text-white hover:bg-brand-700 flex items-center gap-1.5"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> Intervene in Dispatch Console
                      </button>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Lock className="h-3.5 w-3.5 text-amber-500" />
                      <span>Internal Staff Notes (Hidden from Consumer)</span>
                    </div>

                    <div className="space-y-2">
                      {activeTicket.internalNotes.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">No internal notes added yet.</p>
                      ) : (
                        activeTicket.internalNotes.map((n) => (
                          <div
                            key={n.id}
                            className="rounded-xl bg-amber-50/60 border border-amber-200/70 p-3 text-xs"
                          >
                            <div className="flex justify-between font-bold text-amber-900 text-[11px] mb-1">
                              <span>{n.authorName}</span>
                              <span className="text-slate-400 font-normal">
                                {formatDate(n.createdAt)}
                              </span>
                            </div>
                            <p className="text-slate-700">{n.note}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handleAddInternalNote} className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={newInternalNote}
                        onChange={(e) => setNewInternalNote(e.target.value)}
                        placeholder="Add an internal note or escalation observation..."
                        className="flex-1 rounded-xl border border-slate-300 p-2.5 text-xs bg-white focus:border-brand-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 flex items-center gap-1"
                      >
                        <Send className="h-3.5 w-3.5" /> Post Note
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Select a ticket from the left queue to inspect details.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FULL SUPPORT COMMAND CENTER (TICKETS + FAQ/KB CRUD) */}
      {activeTab === 'command' && (
        <AdminSupportCommandCenter
          onOpenDispatchConversation={async (cid) => {
            await handleSelectDispatchConv(cid);
            setActiveTab('dispatch');
          }}
          onDataChanged={fetchAllData}
        />
      )}

      {/* TAB 4: HUMAN AGENT ROSTER & LOAD BALANCING */}
      {activeTab === 'agents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(overview?.agents || []).map((ag) => (
            <div
              key={ag.uid}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      ag.photoURL ||
                      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80'
                    }
                    alt={ag.displayName}
                    className="h-11 w-11 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{ag.displayName}</h4>
                    <p className="text-[11px] text-slate-500 capitalize">
                      {ag.role.replace('_', ' ')} • {ag.email}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase',
                    ag.availability === 'online'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  )}
                >
                  {ag.availability}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {ag.supportedLanguages.map((code) => {
                  const meta = SUPPORTED_CHAT_LANGUAGES.find((l) => l.code === code);
                  return (
                    <span
                      key={code}
                      className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700"
                    >
                      {meta?.flag || '🌐'} {code.toUpperCase()}
                    </span>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center">
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-lg font-black text-slate-900">{ag.activeChats}</p>
                  <p className="text-[10px] font-semibold text-slate-500">Active Chats</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-lg font-black text-slate-900">{ag.assignedTickets}</p>
                  <p className="text-[10px] font-semibold text-slate-500">Open Tickets</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
