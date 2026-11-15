import React, { useEffect, useRef, useState } from 'react';
import {
  SupportTicket,
  SupportFAQ,
  KnowledgeBaseArticle,
  TicketPriority,
  TicketStatus,
} from '@convocart/shared';
import { apiRequest } from '../../lib/api';
import { uploadChatFile } from '../../lib/firebase';
import { decryptSupportPayload, encryptSupportPayload } from '../../lib/encryption';
import { useAuthStore } from '../../stores/useAuthStore';
import { formatDate, cn } from '../../lib/utils';
import {
  MessageSquare,
  HelpCircle,
  FileText,
  Clock,
  Trash2,
  User,
  Edit,
  Plus,
  Search,
  RefreshCw,
  Send,
  Paperclip,
  Loader2,
  Download,
  Lock,
  ShieldCheck,
  Pencil,
  Ban,
  Play,
  Pause,
  Mic,
  X,
  ThumbsUp,
  ThumbsDown,
  Headset,
  ArrowLeft,
} from 'lucide-react';

const SUPPORT_CATEGORIES = [
  'Order & Shipping',
  'International Customs & DHL',
  'Refund & Return Guarantee',
  'NexaDigital License / Kit',
  'Voice / Video Call & Chat Issue',
  'Seller Verification',
  'Human Agent Escalation',
  'General Questions',
];

const KB_CATEGORIES = [
  'Getting Started',
  'Media & Calls',
  'Policies & SLA',
  'Seller Guide',
  'API & Integrations',
  'Troubleshooting',
];

export const AdminAudioPlayer: React.FC<{ src: string }> = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () =>
      setProgress((audio.currentTime / (audio.duration || 1)) * 100);
    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * (audioRef.current.duration || 0);
  };

  const fmtTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const cur = Math.floor((progress / 100) * (duration || 0));

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 min-w-[220px] max-w-[280px]">
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 hover:bg-emerald-500/30"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-1 text-[10px] text-emerald-300 font-semibold">
          <Mic className="w-3 h-3" /> Voice Note
        </div>
        <div
          className="h-1.5 w-full rounded-full bg-slate-700 overflow-hidden cursor-pointer"
          onClick={handleSeek}
        >
          <div className="h-full bg-emerald-400" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>{fmtTime(cur)}</span>
          <span>{fmtTime(Math.floor(duration || 0))}</span>
        </div>
      </div>
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
};

interface AdminSupportCommandCenterProps {
  defaultSection?: 'tickets' | 'faqs' | 'kb';
  onOpenDispatchConversation?: (conversationId: string) => void;
  onDataChanged?: () => void;
}

export const AdminSupportCommandCenter: React.FC<AdminSupportCommandCenterProps> = ({
  defaultSection = 'tickets',
  onOpenDispatchConversation,
  onDataChanged,
}) => {
  const [section, setSection] = useState<'tickets' | 'faqs' | 'kb'>(defaultSection);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqs, setFaqs] = useState<SupportFAQ[]>([]);
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Ticket Filters & Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const currentUser = useAuthStore((s) => s.user);
  // Ticket Replies & Encryption
  const [replyText, setReplyText] = useState('');
  const [encryptReply, setEncryptReply] = useState(true);
  const [decryptedMap, setDecryptedMap] = useState<Record<string, string>>({});
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [newInternalNote, setNewInternalNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // FAQ Modal
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<SupportFAQ | null>(null);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: 'Orders & Shipping' });

  // KB Article Modal
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [articleForm, setArticleForm] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'Getting Started',
    tags: '',
    readTime: '4 min read',
  });

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [ticketList, kbData] = await Promise.all([
        apiRequest<SupportTicket[]>('/support/tickets'),
        apiRequest<{ faqs: SupportFAQ[]; articles: KnowledgeBaseArticle[] }>(
          '/support/knowledge-base'
        ),
      ]);
      setTickets(ticketList || []);
      setFaqs(kbData.faqs || []);
      setArticles(kbData.articles || []);
      if (ticketList?.length && !selectedTicketId) {
        setSelectedTicketId(ticketList[0].ticketId);
      }
    } catch (err) {
      console.error('Failed to load Admin Support Command Center:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const activeTicket =
    tickets.find((t) => t.ticketId === selectedTicketId) || null;

  // Decrypt encrypted description & replies on selected ticket using current user's RSA Private Key
  useEffect(() => {
    if (!activeTicket) {
      setDecryptedMap({});
      return;
    }
    let cancelled = false;
    void (async () => {
      const next: Record<string, string> = {};
      if (activeTicket.rsaEncrypted) {
        next.__description__ = await decryptSupportPayload({
          text: activeTicket.description,
          encrypted: true,
          rsaEncrypted: activeTicket.rsaEncrypted,
          rsaForRecipient: activeTicket.rsaForRecipient,
          rsaForSender: activeTicket.rsaForSender,
          rsaRecipientUid: activeTicket.rsaRecipientUid,
          rsaSenderUid: activeTicket.rsaSenderUid,
          currentUid: currentUser?.uid,
          legacyChannelKey: activeTicket.ticketId,
        });
      }
      for (const r of activeTicket.replies || []) {
        if ((r.encrypted || r.rsaEncrypted) && !r.deletedForEveryone && r.message) {
          next[r.id] = await decryptSupportPayload({
            text: r.message,
            encrypted: r.encrypted,
            rsaEncrypted: r.rsaEncrypted,
            rsaForRecipient: r.rsaForRecipient,
            rsaForSender: r.rsaForSender,
            rsaRecipientUid: r.rsaRecipientUid,
            rsaSenderUid: r.rsaSenderUid,
            currentUid: currentUser?.uid,
            legacyChannelKey: activeTicket.ticketId,
          });
        }
      }
      if (!cancelled) setDecryptedMap(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTicket?.ticketId, activeTicket?.replies, currentUser?.uid]);

  const filteredTickets = tickets.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      t.subject.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.consumerName.toLowerCase().includes(q) ||
      t.ticketId.toLowerCase().includes(q);
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleUpdateTicket = async (
    ticketId: string,
    payload: { status?: TicketStatus; priority?: TicketPriority; assignToMe?: boolean }
  ) => {
    try {
      await apiRequest(`/support/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      await loadAll();
      onDataChanged?.();
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket');
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Delete this support ticket permanently?')) return;
    try {
      await apiRequest(`/support/tickets/${ticketId}`, { method: 'DELETE' });
      if (selectedTicketId === ticketId) setSelectedTicketId(null);
      await loadAll();
      onDataChanged?.();
    } catch (err: any) {
      alert(err.message || 'Failed to delete ticket');
    }
  };

  const handleSendOrEditReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const receiverLookupId = activeTicket.consumerId;
      if (editingReplyId) {
        const plain = replyText.trim();
        const enc = encryptReply
          ? await encryptSupportPayload({
              plaintext: plain,
              receiverLookupId,
              senderUid: currentUser?.uid,
              senderServerPublicKey: currentUser?.rsaPublicKey,
              legacyChannelKey: activeTicket.ticketId,
            })
          : null;
        await apiRequest(
          `/support/tickets/${activeTicket.ticketId}/replies/${editingReplyId}`,
          {
            method: 'PATCH',
            body: JSON.stringify(
              enc && enc.rsaEncrypted
                ? {
                    message: enc.message,
                    rsaEncrypted: true,
                    encryptionAlgorithm: enc.encryptionAlgorithm,
                    rsaForRecipient: enc.rsaForRecipient,
                    rsaForSender: enc.rsaForSender,
                    rsaRecipientUid: enc.rsaRecipientUid,
                    rsaSenderUid: enc.rsaSenderUid,
                  }
                : { message: plain }
            ),
          }
        );
        setEditingReplyId(null);
      } else {
        const enc = encryptReply
          ? await encryptSupportPayload({
              plaintext: replyText.trim(),
              receiverLookupId,
              senderUid: currentUser?.uid,
              senderServerPublicKey: currentUser?.rsaPublicKey,
              legacyChannelKey: activeTicket.ticketId,
            })
          : null;
        await apiRequest(`/support/tickets/${activeTicket.ticketId}/replies`, {
          method: 'POST',
          body: JSON.stringify(
            enc
              ? {
                  message: enc.message,
                  encrypted: enc.encrypted,
                  rsaEncrypted: enc.rsaEncrypted,
                  encryptionAlgorithm: enc.encryptionAlgorithm,
                  rsaForRecipient: enc.rsaForRecipient,
                  rsaForSender: enc.rsaForSender,
                  rsaRecipientUid: enc.rsaRecipientUid,
                  rsaSenderUid: enc.rsaSenderUid,
                }
              : {
                  message: replyText.trim(),
                  encrypted: false,
                }
          ),
        });
      }
      setReplyText('');
      await loadAll();
      onDataChanged?.();
    } catch (err: any) {
      alert(err.message || 'Failed to send reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecallReply = async (replyId: string) => {
    if (!activeTicket) return;
    try {
      await apiRequest(
        `/support/tickets/${activeTicket.ticketId}/replies/${replyId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ deletedForEveryone: true }),
        }
      );
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to recall reply');
    }
  };

  const handleUploadTicketAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file || !activeTicket) return;
    setIsUploading(true);
    try {
      const { url } = await uploadChatFile(file, `ticket_${activeTicket.ticketId}`);
      const isAudio = file.type.startsWith('audio/');
      await apiRequest(`/support/tickets/${activeTicket.ticketId}/replies`, {
        method: 'POST',
        body: JSON.stringify({
          message: isAudio ? `Voice Note (${file.name})` : `Attachment: ${file.name}`,
          attachmentUrl: isAudio ? undefined : url,
          attachmentName: file.name,
          audioUrl: isAudio ? url : undefined,
        }),
      });
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
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
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to post internal note');
    }
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqForm.question.trim() || !faqForm.answer.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingFaq) {
        await apiRequest(`/support/faqs/${editingFaq.id}`, {
          method: 'PUT',
          body: JSON.stringify(faqForm),
        });
      } else {
        await apiRequest('/support/faqs', {
          method: 'POST',
          body: JSON.stringify(faqForm),
        });
      }
      setShowFaqModal(false);
      setEditingFaq(null);
      setFaqForm({ question: '', answer: '', category: 'Orders & Shipping' });
      await loadAll();
      onDataChanged?.();
    } catch (err: any) {
      alert(err.message || 'Failed to save FAQ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFaq = async (faqId: string) => {
    if (!confirm('Delete this FAQ entry?')) return;
    try {
      await apiRequest(`/support/faqs/${faqId}`, { method: 'DELETE' });
      await loadAll();
      onDataChanged?.();
    } catch (err: any) {
      alert(err.message || 'Failed to delete FAQ');
    }
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleForm.title.trim() || !articleForm.summary.trim() || !articleForm.content.trim()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...articleForm,
        tags: articleForm.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };
      if (editingArticle) {
        await apiRequest(`/support/articles/${editingArticle.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/support/articles', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setShowArticleModal(false);
      setEditingArticle(null);
      setArticleForm({
        title: '',
        summary: '',
        content: '',
        category: 'Getting Started',
        tags: '',
        readTime: '4 min read',
      });
      await loadAll();
      onDataChanged?.();
    } catch (err: any) {
      alert(err.message || 'Failed to save KB article');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Delete this Knowledge Base article?')) return;
    try {
      await apiRequest(`/support/articles/${articleId}`, { method: 'DELETE' });
      await loadAll();
      onDataChanged?.();
    } catch (err: any) {
      alert(err.message || 'Failed to delete KB article');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top KPI Cards & Sub-Nav */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Total Tickets</p>
            <p className="text-2xl font-black text-slate-900">{tickets.length}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Active / Open</p>
            <p className="text-2xl font-black text-slate-900">
              {tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length}
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">FAQs Live</p>
            <p className="text-2xl font-black text-slate-900">{faqs.length}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">KB Articles</p>
            <p className="text-2xl font-black text-slate-900">{articles.length}</p>
          </div>
        </div>
      </div>

      {/* Section Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl bg-slate-200/70 p-1 text-xs font-bold">
          <button
            onClick={() => setSection('tickets')}
            className={cn(
              'rounded-lg px-4 py-1.5 transition-colors',
              section === 'tickets' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
            )}
          >
            Ticket Conversations ({tickets.length})
          </button>
          <button
            onClick={() => setSection('faqs')}
            className={cn(
              'rounded-lg px-4 py-1.5 transition-colors',
              section === 'faqs' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
            )}
          >
            FAQ Management ({faqs.length})
          </button>
          <button
            onClick={() => setSection('kb')}
            className={cn(
              'rounded-lg px-4 py-1.5 transition-colors',
              section === 'kb' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
            )}
          >
            Knowledge Base ({articles.length})
          </button>
        </div>

        <button
          onClick={() => void loadAll()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {/* SECTION 1: TWO-PANE ADMIN TICKET CONVERSATIONS */}
      {section === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Pane: Search + Ticket Queue */}
          <div
            className={cn(
              'lg:col-span-5 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[660px]',
              activeTicket && 'hidden lg:flex'
            )}
          >
            <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Tickets ({filteredTickets.length})
                </h3>
                <div className="flex items-center gap-1.5">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700"
                  >
                    <option value="all">All Priority</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search subject, customer, or ticket ID..."
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredTickets.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  No support tickets match the current filters.
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const lastReply = t.replies?.[t.replies.length - 1];
                  const awaitingAgent = lastReply && !lastReply.isAdminOrAgent;
                  return (
                    <button
                      key={t.ticketId}
                      onClick={() => setSelectedTicketId(t.ticketId)}
                      className={cn(
                        'w-full text-left p-4 transition-colors',
                        activeTicket?.ticketId === t.ticketId
                          ? 'bg-indigo-50/70 border-l-4 border-indigo-600'
                          : awaitingAgent
                          ? 'bg-amber-50/60 hover:bg-amber-50'
                          : 'hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                            t.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : t.status === 'in_progress'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          )}
                        >
                          {t.status.replace('_', ' ')}
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                            t.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-700'
                              : t.priority === 'high'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-slate-100 text-slate-600'
                          )}
                        >
                          {t.priority}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate">{t.subject}</h4>
                      <p className="text-[11px] font-medium text-slate-600 truncate mt-0.5">
                        {t.consumerName} ({t.consumerEmail})
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">{t.description}</p>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                        <span>{formatDate(t.createdAt)}</span>
                        <span className="flex items-center gap-2">
                          {awaitingAgent && (
                            <span className="text-amber-600 font-bold">● New Customer Reply</span>
                          )}
                          <span>{t.replies?.length || 0} replies</span>
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Pane: Ticket Conversation Thread & Controls */}
          <div
            className={cn(
              'lg:col-span-7 rounded-3xl border border-slate-200 bg-slate-950 text-slate-100 shadow-sm overflow-hidden flex flex-col h-[660px]',
              !activeTicket && 'hidden lg:flex'
            )}
          >
            {!activeTicket ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs p-8">
                <MessageSquare className="h-12 w-12 mb-3 opacity-40" />
                <p>Select a support ticket to reply, decrypt attachments, or update SLA status.</p>
              </div>
            ) : (
              <>
                {/* Ticket Header */}
                <div className="px-4 py-3 border-b border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => setSelectedTicketId(null)}
                      className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{activeTicket.subject}</h3>
                      <p className="text-[11px] text-slate-400 truncate">
                        {activeTicket.category} · #{activeTicket.ticketId} · {activeTicket.consumerName}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={activeTicket.status}
                      onChange={(e) =>
                        void handleUpdateTicket(activeTicket.ticketId, {
                          status: e.target.value as TicketStatus,
                        })
                      }
                      className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-white"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting_on_customer">Waiting on Customer</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>

                    {activeTicket.conversationId && onOpenDispatchConversation && (
                      <button
                        onClick={() => onOpenDispatchConversation(activeTicket.conversationId!)}
                        className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/30 flex items-center gap-1"
                      >
                        <Headset className="h-3 w-3" /> Live Dispatch
                      </button>
                    )}

                    <button
                      onClick={() => void handleDeleteTicket(activeTicket.ticketId)}
                      className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20"
                      title="Delete Ticket"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Conversation Thread */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Initial Ticket Body */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="rounded-2xl rounded-tl-none border border-slate-800 bg-slate-900 p-3 text-xs text-slate-200 whitespace-pre-wrap">
                        {activeTicket.rsaEncrypted
                          ? decryptedMap.__description__ || '[Decrypting RSA-2048 payload...]'
                          : activeTicket.description}
                      </div>
                      {activeTicket.attachedFileUrl && (
                        <a
                          href={activeTicket.attachedFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-sky-300 hover:bg-slate-800"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {activeTicket.attachedFileName || 'Download Attachment'}
                        </a>
                      )}
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Customer • {formatDate(activeTicket.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Replies */}
                  {(activeTicket.replies || []).map((reply) => {
                    const isStaff = reply.isAdminOrAgent;
                    const displayText =
                      decryptedMap[reply.id] !== undefined
                        ? decryptedMap[reply.id]
                        : reply.message;

                    if (reply.deletedForEveryone) {
                      return (
                        <div
                          key={reply.id}
                          className={cn('flex', isStaff ? 'justify-end' : 'justify-start')}
                        >
                          <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs italic text-slate-500">
                            <Ban className="w-3.5 h-3.5" /> This message was deleted
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={reply.id}
                        className={cn('flex items-start gap-3', isStaff && 'flex-row-reverse')}
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border',
                            isStaff
                              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                              : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                          )}
                        >
                          {isStaff ? <Headset className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className={cn('flex-1 flex flex-col', isStaff ? 'items-end' : 'items-start')}>
                          <div
                            className={cn(
                              'group relative max-w-[85%] rounded-2xl p-3 text-xs space-y-2',
                              isStaff
                                ? 'bg-emerald-700/80 text-white rounded-tr-none'
                                : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                            )}
                          >
                            {reply.audioUrl && <AdminAudioPlayer src={reply.audioUrl} />}
                            {reply.attachmentUrl && (
                              <a
                                href={reply.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-lg bg-black/25 px-2.5 py-1.5 text-[11px] font-semibold text-sky-200 hover:underline"
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                                {reply.attachmentName || 'Download Attachment'}
                              </a>
                            )}
                            {displayText && <p className="whitespace-pre-wrap">{displayText}</p>}
                            <div className="flex items-center justify-between gap-3 text-[10px] opacity-75">
                              <span className="flex items-center gap-1">
                                {reply.encrypted && <ShieldCheck className="w-3 h-3" />}
                                {reply.senderName} · {formatDate(reply.createdAt)}
                                {reply.editedAt && ' (edited)'}
                              </span>
                              <span className="flex items-center gap-1.5">
                                {isStaff && !reply.audioUrl && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingReplyId(reply.id);
                                      setReplyText(displayText);
                                    }}
                                    className="hover:underline inline-flex items-center gap-0.5"
                                  >
                                    <Pencil className="w-2.5 h-2.5" /> Edit
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => void handleRecallReply(reply.id)}
                                  className="hover:underline text-rose-200"
                                >
                                  Delete
                                </button>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Internal Staff Notes */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                      <Lock className="w-3.5 h-3.5" /> Internal Staff Notes (Private)
                    </div>
                    {activeTicket.internalNotes.map((n) => (
                      <div
                        key={n.id}
                        className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-100"
                      >
                        <div className="flex justify-between text-[10px] text-amber-300 mb-0.5">
                          <span className="font-bold">{n.authorName}</span>
                          <span>{formatDate(n.createdAt)}</span>
                        </div>
                        <p>{n.note}</p>
                      </div>
                    ))}
                    <form onSubmit={handleAddInternalNote} className="flex gap-2">
                      <input
                        type="text"
                        value={newInternalNote}
                        onChange={(e) => setNewInternalNote(e.target.value)}
                        placeholder="Add private staff note..."
                        className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded-xl border border-amber-500/30 bg-amber-500/20 px-3 py-1.5 text-[11px] font-bold text-amber-200 hover:bg-amber-500/30"
                      >
                        Save Note
                      </button>
                    </form>
                  </div>
                </div>

                {/* Reply Composer */}
                <form
                  onSubmit={handleSendOrEditReply}
                  className="p-3 border-t border-slate-800 bg-slate-900 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <label className="inline-flex items-center gap-1.5 text-emerald-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={encryptReply}
                        onChange={(e) => setEncryptReply(e.target.checked)}
                        className="accent-emerald-500"
                      />
                      <ShieldCheck className="w-3.5 h-3.5" />
                      RSA-2048 Public Key Encrypted Reply (Receiver Private Key Only)
                    </label>
                    {editingReplyId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingReplyId(null);
                          setReplyText('');
                        }}
                        className="text-amber-300 hover:underline"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleUploadTicketAttachment}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-slate-300 hover:text-white"
                      title="Attach file"
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Paperclip className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={
                        editingReplyId
                          ? 'Edit reply message...'
                          : 'Send customer response...'
                      }
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || !replyText.trim()}
                      className="rounded-xl bg-[#00a884] px-4 py-2 text-xs font-bold text-[#111b21] hover:bg-[#029676] disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" /> {editingReplyId ? 'Update' : 'Send'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: FAQ MANAGEMENT */}
      {section === 'faqs' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">FAQ Manager</h3>
              <p className="text-xs text-slate-500">
                Create, edit, or retire frequently asked questions displayed in the Customer Support Hub.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingFaq(null);
                setFaqForm({ question: '', answer: '', category: 'Orders & Shipping' });
                setShowFaqModal(true);
              }}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add FAQ
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700">
                      {faq.category}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                        <ThumbsUp className="w-3 h-3" /> {faq.helpful}
                      </span>
                      <span className="inline-flex items-center gap-1 text-rose-500 font-semibold">
                        <ThumbsDown className="w-3 h-3" /> {faq.notHelpful}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{faq.question}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/80">
                  <button
                    onClick={() => {
                      setEditingFaq(faq);
                      setFaqForm({
                        question: faq.question,
                        answer: faq.answer,
                        category: faq.category,
                      });
                      setShowFaqModal(true);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => void handleDeleteFaq(faq.id)}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: KNOWLEDGE BASE MANAGER */}
      {section === 'kb' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Knowledge Base Articles
              </h3>
              <p className="text-xs text-slate-500">
                Publish troubleshooting playbooks and SDK onboarding guides.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingArticle(null);
                setArticleForm({
                  title: '',
                  summary: '',
                  content: '',
                  category: 'Getting Started',
                  tags: '',
                  readTime: '4 min read',
                });
                setShowArticleModal(true);
              }}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> New Article
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((art) => (
              <div
                key={art.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="rounded-full bg-sky-100 px-2.5 py-0.5 font-bold text-sky-700">
                      {art.category}
                    </span>
                    <span>
                      {art.readTime} · {art.views} views
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{art.title}</h4>
                  <p className="text-xs text-slate-600">{art.summary}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {art.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/80">
                  <button
                    onClick={() => {
                      setEditingArticle(art);
                      setArticleForm({
                        title: art.title,
                        summary: art.summary,
                        content: art.content,
                        category: art.category,
                        tags: art.tags.join(', '),
                        readTime: art.readTime,
                      });
                      setShowArticleModal(true);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => void handleDeleteArticle(art.id)}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ CREATE / EDIT MODAL */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleSaveFaq}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 text-slate-900"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black">
                {editingFaq ? 'Edit FAQ Entry' : 'Create New FAQ'}
              </h3>
              <button
                type="button"
                onClick={() => setShowFaqModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={faqForm.category}
                onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              >
                {SUPPORT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Question</label>
              <input
                type="text"
                required
                value={faqForm.question}
                onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Answer</label>
              <textarea
                rows={4}
                required
                value={faqForm.answer}
                onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowFaqModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white"
              >
                {editingFaq ? 'Save Changes' : 'Create FAQ'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KB ARTICLE CREATE / EDIT MODAL */}
      {showArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleSaveArticle}
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-3 text-slate-900"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black">
                {editingArticle ? 'Edit Knowledge Base Article' : 'Create Knowledge Base Article'}
              </h3>
              <button
                type="button"
                onClick={() => setShowArticleModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={articleForm.category}
                  onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                >
                  {KB_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Read Time</label>
                <input
                  type="text"
                  value={articleForm.readTime}
                  onChange={(e) => setArticleForm({ ...articleForm, readTime: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
              <input
                type="text"
                required
                value={articleForm.title}
                onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Summary</label>
              <input
                type="text"
                required
                value={articleForm.summary}
                onChange={(e) => setArticleForm({ ...articleForm, summary: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={articleForm.tags}
                onChange={(e) => setArticleForm({ ...articleForm, tags: e.target.value })}
                placeholder="Nexconn SDK, SLA, Orders"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Content</label>
              <textarea
                rows={5}
                required
                value={articleForm.content}
                onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowArticleModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white"
              >
                {editingArticle ? 'Update Article' : 'Publish Article'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
