import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { SupportTicket, TicketStatus } from '@convocart/shared';
import { formatDate } from '../lib/utils';
import { useChatStore } from '../stores/useChatStore';
import {
  Headphones,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  UserCheck,
  Send,
  Lock,
} from 'lucide-react';

export const SupportDashboardPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newInternalNote, setNewInternalNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const { selectConversation } = useChatStore();

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<SupportTicket[]>('/support/tickets');
      setTickets(data);
      if (data.length > 0 && !activeTicketId) {
        setActiveTicketId(data[0].ticketId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const activeTicket = tickets.find((t) => t.ticketId === activeTicketId);

  const handleAssignToMe = async (ticketId: string) => {
    try {
      await apiRequest(`/support/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ assignToMe: true, status: 'in_progress' }),
      });
      fetchTickets();
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
      fetchTickets();
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
      fetchTickets();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = tickets.filter((t) => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Support Ticket Queues & Escalations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Resolve consumer complaints, review AI conversation transcripts, and manage SLA commitments.
          </p>
        </div>

        <div className="flex rounded-xl bg-slate-200/60 p-1 text-xs font-semibold">
          {['all', 'open', 'in_progress', 'resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1 capitalize transition-colors ${
                statusFilter === st ? 'bg-white shadow text-slate-900' : 'text-slate-600'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List Column */}
        <div className="lg:col-span-1 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[650px]">
          <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-600">
            Inbox ({filtered.length} Tickets)
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filtered.map((t) => {
              const isSelected = activeTicketId === t.ticketId;
              return (
                <div
                  key={t.ticketId}
                  onClick={() => setActiveTicketId(t.ticketId)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? 'bg-brand-50/70 border-l-4 border-brand-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="font-bold text-slate-900 truncate max-w-[150px]">{t.consumerName}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                        t.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-700'
                          : t.priority === 'high'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
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

        {/* Ticket Details & Action Column */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col h-[650px] overflow-y-auto space-y-6">
          {activeTicket ? (
            <>
              {/* Header Bar */}
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
                    Filed by {activeTicket.consumerName} ({activeTicket.consumerEmail}) • SLA Commitment: {activeTicket.slaDueHours}h
                  </p>
                </div>

                {/* State Controls */}
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

              {/* Description Body */}
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900 block mb-1">Customer Description:</span>
                {activeTicket.description}
              </div>

              {/* Related Order or Conversation Bridge */}
              <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-4 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Linked Customer Conversation</span>
                  <span className="text-slate-500 text-[11px]">
                    Customer chat context is synchronized through Nexconn communications.
                  </span>
                </div>
                {activeTicket.conversationId && (
                  <button
                    onClick={() => selectConversation(activeTicket.conversationId!)}
                    className="rounded-xl bg-brand-600 px-4 py-2 font-bold text-white hover:bg-brand-700 flex items-center gap-1.5"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Open Chat Stream
                  </button>
                )}
              </div>

              {/* Internal Staff Notes (Authoritative hidden notes) */}
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
                      <div key={n.id} className="rounded-xl bg-amber-50/60 border border-amber-200/70 p-3 text-xs">
                        <div className="flex justify-between font-bold text-amber-900 text-[11px] mb-1">
                          <span>{n.authorName}</span>
                          <span className="text-slate-400 font-normal">{formatDate(n.createdAt)}</span>
                        </div>
                        <p className="text-slate-700">{n.note}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Internal Note Form */}
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
  );
};
