import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Product,
  SupportFAQ,
  KnowledgeBaseArticle,
  SupportTicket,
  TicketPriority,
} from '@convocart/shared';
import { apiRequest } from '../lib/api';
import { syncTicketToFirestore, uploadChatFile } from '../lib/firebase';
import { decryptSupportPayload, encryptSupportPayload } from '../lib/encryption';
import { nexconnClient } from '../lib/nexconnClient';
import { useChatStore } from '../stores/useChatStore';
import { useAuthStore } from '../stores/useAuthStore';
import { AdminAudioPlayer } from '../features/support/AdminSupportCommandCenter';
import {
  Headphones,
  Clock,
  ShieldCheck,
  MessageSquare,
  Phone,
  Video,
  CheckCircle2,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  Send,
  Database,
  Sparkles,
  FileText,
  X,
  Paperclip,
  Lock,
  Pencil,
  Ban,
  Download,
  Loader2,
  Package,
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';

interface SlaItem {
  priority: TicketPriority;
  label: string;
  responseWindow: string;
  channel: string;
}

interface KnowledgeBaseResponse {
  faqs: SupportFAQ[];
  articles: KnowledgeBaseArticle[];
  slaTimelines: SlaItem[];
}

export const CustomerSupportPage: React.FC = () => {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const initialProductId = searchParams.get('productId') || '';
  const { startConversationWithVendor, selectConversation, startCall, escalateConversation } =
    useChatStore();

  const [activeTab, setActiveTab] = useState<'submit' | 'tickets' | 'kb'>('submit');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId);
  const [faqs, setFaqs] = useState<SupportFAQ[]>([]);
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [slaTimelines, setSlaTimelines] = useState<SlaItem[]>([
    { priority: 'urgent', label: 'Urgent', responseWindow: '~2–4 hours', channel: 'Instant Human Dispatch & Call' },
    { priority: 'high', label: 'High', responseWindow: '~8–12 hours', channel: 'Priority Multilingual Queue' },
    { priority: 'medium', label: 'Medium', responseWindow: '~24 hours', channel: 'Standard Ticket & AI Concierge' },
    { priority: 'low', label: 'Low', responseWindow: '~48 hours', channel: 'General Inquiries' },
  ]);
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq_1');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [votedFaqs, setVotedFaqs] = useState<Record<string, 'helpful' | 'notHelpful'>>({});

  // Ticket Form state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Order & Shipping');
  const [priority, setPriority] = useState<TicketPriority>('high');
  const [orderId, setOrderId] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitBanner, setSubmitBanner] = useState<string | null>(null);

  // Interactive Ticket Conversation Modal state (AES-GCM + attachments + replies)
  const [chatTicketId, setChatTicketId] = useState<string | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [encryptTicketReply, setEncryptTicketReply] = useState(true);
  const [decryptedTicketMap, setDecryptedTicketMap] = useState<Record<string, string>>({});
  const [editingTicketReplyId, setEditingTicketReplyId] = useState<string | null>(null);
  const [isSendingTicketReply, setIsSendingTicketReply] = useState(false);
  const [isUploadingTicketFile, setIsUploadingTicketFile] = useState(false);
  const ticketFileInputRef = useRef<HTMLInputElement>(null);

  const sdkCaps = nexconnClient.getSdkCapabilities();

  const selectedProduct = products.find((p) => p.productId === selectedProductId) || products[0] || null;

  const loadData = async () => {
    try {
      const [kbData, prodData] = await Promise.all([
        apiRequest<KnowledgeBaseResponse>('/support/knowledge-base'),
        apiRequest<{ products: Product[] }>('/products?limit=100').catch(() => ({ products: [] as Product[] })),
      ]);
      const loadedProducts = prodData.products || [];
      setProducts(loadedProducts);
      if (initialProductId && loadedProducts.some((p) => p.productId === initialProductId)) {
        setSelectedProductId(initialProductId);
      } else if (!selectedProductId && loadedProducts.length > 0) {
        setSelectedProductId(loadedProducts[0].productId);
      }
      setFaqs(kbData.faqs || []);
      setArticles(kbData.articles || []);
      if (kbData.slaTimelines?.length) setSlaTimelines(kbData.slaTimelines);
    } catch {
      // ignore
    }

    if (user) {
      try {
        const tickets = await apiRequest<SupportTicket[]>('/support/tickets');
        setMyTickets(tickets || []);
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    void loadData();
  }, [user?.uid, initialProductId]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim() || isSubmitting) return;
    if (products.length > 0 && !selectedProduct) {
      setSubmitBanner('Please select a seller product for product-based support.');
      return;
    }
    setIsSubmitting(true);
    setSubmitBanner(null);

    try {
      const receiverLookupId = selectedProduct?.vendorId || 'support_default';
      const encDesc = await encryptSupportPayload({
        plaintext: description.trim(),
        receiverLookupId,
        senderUid: user?.uid,
        senderServerPublicKey: user?.rsaPublicKey,
        legacyChannelKey: `ticket_${Date.now()}`,
      });

      const created = await apiRequest<SupportTicket>('/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          subject: subject.trim(),
          category,
          priority,
          productId: selectedProduct?.productId,
          orderId: orderId.trim() || undefined,
          description: encDesc.rsaEncrypted ? encDesc.message : description.trim(),
          ...(encDesc.rsaEncrypted
            ? {
                rsaEncrypted: true,
                encryptionAlgorithm: encDesc.encryptionAlgorithm,
                rsaForRecipient: encDesc.rsaForRecipient,
                rsaForSender: encDesc.rsaForSender,
                rsaRecipientUid: encDesc.rsaRecipientUid,
                rsaSenderUid: encDesc.rsaSenderUid,
              }
            : {}),
        }),
      });
      await syncTicketToFirestore(created);
      setMyTickets((prev) => [created, ...prev]);
      setSubject('');
      setOrderId('');
      setDescription('');
      setSubmitBanner(
        `Ticket ${created.ticketId}${created.productTitle ? ` for "${created.productTitle}"` : ''} created and routed to the seller & support center.`
      );
      setActiveTab('tickets');
    } catch (err: any) {
      setSubmitBanner(err?.message || 'Sign in as a Customer to submit a product support ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteFaq = async (faqId: string, vote: 'helpful' | 'notHelpful') => {
    if (votedFaqs[faqId]) return;
    setVotedFaqs((prev) => ({ ...prev, [faqId]: vote }));
    try {
      const updated = await apiRequest<SupportFAQ>(`/support/faqs/${faqId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ vote }),
      });
      setFaqs((prev) => prev.map((f) => (f.id === faqId ? updated : f)));
    } catch {
      // ignore
    }
  };

  const activeChatTicket = myTickets.find((t) => t.ticketId === chatTicketId) || null;
  const totalAgentReplies = myTickets.reduce(
    (acc, t) =>
      acc +
      (t.replies?.filter((r) => r.senderRole !== 'consumer' && !r.deletedForEveryone).length || 0),
    0
  );

  useEffect(() => {
    if (!activeChatTicket) {
      setDecryptedTicketMap({});
      return;
    }
    let cancelled = false;
    void (async () => {
      const next: Record<string, string> = {};
      if (activeChatTicket.rsaEncrypted) {
        next.__description__ = await decryptSupportPayload({
          text: activeChatTicket.description,
          encrypted: true,
          rsaEncrypted: activeChatTicket.rsaEncrypted,
          rsaForRecipient: activeChatTicket.rsaForRecipient,
          rsaForSender: activeChatTicket.rsaForSender,
          rsaRecipientUid: activeChatTicket.rsaRecipientUid,
          rsaSenderUid: activeChatTicket.rsaSenderUid,
          currentUid: user?.uid,
          legacyChannelKey: activeChatTicket.ticketId,
        });
      }
      for (const r of activeChatTicket.replies || []) {
        if ((r.encrypted || r.rsaEncrypted) && !r.deletedForEveryone && r.message) {
          next[r.id] = await decryptSupportPayload({
            text: r.message,
            encrypted: r.encrypted,
            rsaEncrypted: r.rsaEncrypted,
            rsaForRecipient: r.rsaForRecipient,
            rsaForSender: r.rsaForSender,
            rsaRecipientUid: r.rsaRecipientUid,
            rsaSenderUid: r.rsaSenderUid,
            currentUid: user?.uid,
            legacyChannelKey: activeChatTicket.ticketId,
          });
        }
      }
      if (!cancelled) setDecryptedTicketMap(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeChatTicket?.ticketId, activeChatTicket?.replies, user?.uid]);

  const handleSendOrEditTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatTicket || !ticketReplyText.trim() || isSendingTicketReply) return;
    setIsSendingTicketReply(true);
    try {
      const receiverLookupId =
        activeChatTicket.assignedAgentId ||
        activeChatTicket.vendorOwnerUid ||
        activeChatTicket.vendorId ||
        'support_default';

      if (editingTicketReplyId) {
        const plain = ticketReplyText.trim();
        const enc = encryptTicketReply
          ? await encryptSupportPayload({
              plaintext: plain,
              receiverLookupId,
              senderUid: user?.uid,
              senderServerPublicKey: user?.rsaPublicKey,
              legacyChannelKey: activeChatTicket.ticketId,
            })
          : null;
        await apiRequest(
          `/support/tickets/${activeChatTicket.ticketId}/replies/${editingTicketReplyId}`,
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
        setEditingTicketReplyId(null);
      } else {
        const enc = encryptTicketReply
          ? await encryptSupportPayload({
              plaintext: ticketReplyText.trim(),
              receiverLookupId,
              senderUid: user?.uid,
              senderServerPublicKey: user?.rsaPublicKey,
              legacyChannelKey: activeChatTicket.ticketId,
            })
          : null;
        await apiRequest(`/support/tickets/${activeChatTicket.ticketId}/replies`, {
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
                  message: ticketReplyText.trim(),
                  encrypted: false,
                }
          ),
        });
      }
      setTicketReplyText('');
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to send reply');
    } finally {
      setIsSendingTicketReply(false);
    }
  };

  const handleRecallTicketReply = async (replyId: string) => {
    if (!activeChatTicket) return;
    try {
      await apiRequest(
        `/support/tickets/${activeChatTicket.ticketId}/replies/${replyId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ deletedForEveryone: true }),
        }
      );
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to recall reply');
    }
  };

  const handleUploadTicketAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file || !activeChatTicket) return;
    setIsUploadingTicketFile(true);
    try {
      const { url } = await uploadChatFile(file, `ticket_${activeChatTicket.ticketId}`);
      const isAudio = file.type.startsWith('audio/');
      await apiRequest(`/support/tickets/${activeChatTicket.ticketId}/replies`, {
        method: 'POST',
        body: JSON.stringify({
          message: isAudio ? `Voice Note (${file.name})` : `Attachment: ${file.name}`,
          attachmentUrl: isAudio ? undefined : url,
          attachmentName: file.name,
          audioUrl: isAudio ? url : undefined,
        }),
      });
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Attachment upload failed');
    } finally {
      setIsUploadingTicketFile(false);
    }
  };

  const handleContactProductSeller = async (product?: Product | null) => {
    const targetProduct = product || selectedProduct;
    if (!targetProduct) {
      setSubmitBanner('No seller-uploaded products are available yet. Ask a seller to upload a product first.');
      return;
    }
    try {
      await startConversationWithVendor(targetProduct.vendorId, targetProduct.productId);
    } catch (err: any) {
      setSubmitBanner(err?.message || 'Unable to start live chat with this product seller.');
    }
  };

  const handleEscalateProductChat = async (product?: Product | null) => {
    const targetProduct = product || selectedProduct;
    if (!targetProduct) return;
    try {
      const convId = await startConversationWithVendor(targetProduct.vendorId, targetProduct.productId);
      await escalateConversation(convId, `Product support inquiry for ${targetProduct.title}`);
    } catch {
      // Redirected or handled gracefully
    }
  };

  const filteredFaqs = faqs.filter(
    (f) =>
      !searchQuery.trim() ||
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredArticles = articles.filter(
    (a) =>
      !searchQuery.trim() ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-20">
      {/* Header Banner */}
      <section className="border-b border-zinc-800/80 bg-[#0c0c0f]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                <Headphones className="h-3.5 w-3.5" />
                <span>Nexconn × ConvoCart Multilingual Support Center</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Live Buyer Support & Human Agent Dispatch Hub
              </h1>
              <p className="text-sm text-zinc-400">
                Submit priority support tickets, launch instant 1-on-1 auto-translated chat or live WebRTC calls with verified sellers and human specialists, or browse the ConvoCart Knowledge Base.
              </p>

              {/* Live Cloud + Nexconn SDK Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-300">
                  <Database className="h-3 w-3" />
                  Cloud Support Sync: Connected
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 font-semibold text-sky-300">
                  <MessageSquare className="h-3 w-3" />
                  {sdkCaps.chatSdk}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 font-semibold text-indigo-300">
                  <Phone className="h-3 w-3" />
                  {sdkCaps.callSdk}
                </span>
              </div>
            </div>

            {/* Product-Based Direct Seller Contact Card */}
            <div className="rounded-2xl border border-zinc-800 bg-[#141418] p-5 space-y-3 lg:w-96 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-400" /> Product Seller Contact
                </span>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  Real-Time Chat
                </span>
              </div>
              {products.length > 0 ? (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Select Product to Contact Seller
                    </label>
                    <select
                      value={selectedProduct?.productId || ''}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.productId} value={p.productId}>
                          {p.title} — {p.vendorName || p.brand}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => void handleContactProductSeller(selectedProduct)}
                    className="w-full rounded-xl bg-[#00a884] px-4 py-2.5 text-xs font-bold text-[#111b21] hover:bg-[#029676] transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" /> Chat Real-Time with Seller
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        startCall(
                          selectedProduct?.vendorName || 'Product Seller',
                          undefined,
                          false
                        )
                      }
                      className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 flex items-center justify-center gap-1.5"
                    >
                      <Phone className="h-3.5 w-3.5 text-emerald-400" /> Call Seller
                    </button>
                    <button
                      onClick={() =>
                        startCall(
                          selectedProduct?.vendorName || 'Product Seller',
                          undefined,
                          true
                        )
                      }
                      className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 flex items-center justify-center gap-1.5"
                    >
                      <Video className="h-3.5 w-3.5 text-sky-400" /> Video Call
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2.5 text-xs text-zinc-400">
                  <p>
                    No seller products uploaded yet. Support tickets and real-time seller chats unlock automatically once a seller uploads a product.
                  </p>
                  <Link
                    to="/auth"
                    className="w-full rounded-xl bg-[#00a884] px-4 py-2.5 text-xs font-bold text-[#111b21] hover:bg-[#029676] transition-colors flex items-center justify-center gap-2"
                  >
                    Seller Sign In / Upload Product
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* SLA Response Timelines Grid */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {slaTimelines.map((sla) => (
              <div
                key={sla.priority}
                className="rounded-2xl border border-zinc-800 bg-[#141418]/90 p-4 flex items-start gap-3"
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                    sla.priority === 'urgent'
                      ? 'bg-rose-500/15 text-rose-400'
                      : sla.priority === 'high'
                      ? 'bg-amber-500/15 text-amber-400'
                      : sla.priority === 'medium'
                      ? 'bg-sky-500/15 text-sky-400'
                      : 'bg-zinc-800 text-zinc-400'
                  )}
                >
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{sla.label} SLA</span>
                    <span className="text-[11px] font-mono font-semibold text-emerald-400">
                      {sla.responseWindow}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{sla.channel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Tabs */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-4 mb-6">
          <button
            onClick={() => setActiveTab('submit')}
            className={cn(
              'rounded-full px-4 py-2 text-xs font-bold transition-colors',
              activeTab === 'submit'
                ? 'bg-white text-black'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            )}
          >
            Submit Support Ticket
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={cn(
              'rounded-full px-4 py-2 text-xs font-bold transition-colors flex items-center gap-2',
              activeTab === 'tickets'
                ? 'bg-white text-black'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            )}
          >
            <span>My Support Tickets</span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">
              {myTickets.length}
            </span>
            {totalAgentReplies > 0 && (
              <span className="rounded-full bg-sky-500/20 border border-sky-500/30 px-2 py-0.5 text-[10px] text-sky-300">
                {totalAgentReplies} replies
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('kb')}
            className={cn(
              'rounded-full px-4 py-2 text-xs font-bold transition-colors flex items-center gap-1.5',
              activeTab === 'kb'
                ? 'bg-white text-black'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            )}
          >
            <BookOpen className="h-3.5 w-3.5" />
            FAQ & Knowledge Base ({faqs.length + articles.length})
          </button>
        </div>

        {submitBanner && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              {submitBanner}
            </span>
            <button onClick={() => setSubmitBanner(null)} className="text-emerald-300 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* TAB 1: Submit Ticket */}
        {activeTab === 'submit' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <form
              onSubmit={handleSubmitTicket}
              className="lg:col-span-7 rounded-2xl border border-zinc-800 bg-[#141418] p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Create Product Support Ticket</h2>
                <span className="text-[11px] text-amber-300 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Encrypted Cloud Sync
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Seller Product {products.length > 0 ? '*' : '(Awaiting Seller Upload)'}
                </label>
                {products.length > 0 ? (
                  <div className="space-y-1.5">
                    <select
                      required
                      value={selectedProduct?.productId || ''}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs text-white focus:border-zinc-600 focus:outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.productId} value={p.productId}>
                          {p.title} · Seller: {p.vendorName || p.brand} (${p.price})
                        </option>
                      ))}
                    </select>
                    {selectedProduct && (
                      <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-3 py-2 text-[11px]">
                        <span className="text-zinc-300 flex items-center gap-1.5 truncate">
                          <Package className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          Seller: <strong className="text-white">{selectedProduct.vendorName || selectedProduct.brand}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleContactProductSeller(selectedProduct)}
                          className="text-emerald-400 hover:underline font-bold shrink-0 ml-2"
                        >
                          Live Chat Seller →
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-3 py-2.5 text-xs text-zinc-400">
                    No seller-uploaded products found yet. Upload a product as a Seller to enable product-linked support tickets.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs text-white focus:border-zinc-600 focus:outline-none"
                  >
                    <option>Product Inquiry &amp; Specs</option>
                    <option>Order &amp; Shipping</option>
                    <option>Refund &amp; Return Guarantee</option>
                    <option>Warranty &amp; Defect Support</option>
                    <option>Voice / Video Call &amp; Chat Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Priority SLA</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs text-white focus:border-zinc-600 focus:outline-none"
                  >
                    <option value="urgent">Urgent (~2–4h)</option>
                    <option value="high">High (~8–12h)</option>
                    <option value="medium">Medium (~24h)</option>
                    <option value="low">Low (~48h)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Question about product sizing or delivery"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                    Order ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="Optional order reference"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Describe Your Issue
                </label>
                <textarea
                  rows={5}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share details so a human specialist or bilingual vendor can resolve it quickly..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-extrabold text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {isSubmitting ? 'Submitting Ticket...' : 'Submit Support Ticket'}
              </button>
            </form>

            {/* Quick FAQ Preview beside form */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-[#141418] p-6">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" /> Quick Answers Before You Wait
                </h3>
                <div className="space-y-2.5">
                  {faqs.slice(0, 4).map((faq) => (
                    <div
                      key={faq.id}
                      className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3"
                    >
                      <p className="text-xs font-semibold text-zinc-100">{faq.question}</p>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{faq.answer}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab('kb')}
                  className="mt-4 text-xs font-bold text-[#00a884] hover:underline"
                >
                  Browse Full FAQ &amp; Knowledge Base →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: My Support Tickets */}
        {activeTab === 'tickets' && (
          <div className="space-y-3">
            {myTickets.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800 bg-[#141418] p-10 text-center text-sm text-zinc-400">
                No support tickets yet. Submit one or start a 1-on-1 translated dispatch chat above!
              </div>
            ) : (
              myTickets.map((t) => (
                <div
                  key={t.ticketId}
                  className="rounded-2xl border border-zinc-800 bg-[#141418] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-zinc-400">{t.ticketId}</span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                          t.priority === 'urgent'
                            ? 'bg-rose-500/20 text-rose-300'
                            : t.priority === 'high'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-sky-500/20 text-sky-300'
                        )}
                      >
                        {t.priority} · {t.slaDueHours}h SLA
                      </span>
                      <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                        {t.status.replace('_', ' ')}
                      </span>
                      {t.firebaseSynced && (
                        <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300">
                          Cloud Synced
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white">{t.subject}</h3>
                    {t.productTitle && (
                      <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <Package className="h-3 w-3" /> Product: {t.productTitle}
                      </p>
                    )}
                    <p className="text-xs text-zinc-400">
                      {t.rsaEncrypted
                        ? '🔒 Encrypted with RSA-2048 Public Key (Open Ticket Chat to decrypt with your Private Key)'
                        : t.description}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Category: {t.category} · Created {formatDate(t.createdAt)}
                      {t.assignedAgentName ? ` · Assigned Specialist: ${t.assignedAgentName}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setChatTicketId(t.ticketId);
                        setEditingTicketReplyId(null);
                        setTicketReplyText('');
                      }}
                      className="rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-3.5 py-2 text-xs font-bold text-indigo-200 hover:bg-indigo-500/25 flex items-center gap-1.5"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Open Ticket Chat
                      {(t.replies?.length || 0) > 0 && (
                        <span className="rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] text-white">
                          {t.replies?.length}
                        </span>
                      )}
                    </button>
                    {t.conversationId ? (
                      <button
                        onClick={() => void selectConversation(t.conversationId!, true)}
                        className="rounded-xl bg-[#00a884] px-4 py-2 text-xs font-bold text-[#111b21] hover:bg-[#029676] flex items-center gap-1.5"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> Open Seller Chat
                      </button>
                    ) : t.vendorId ? (
                      <button
                        onClick={() => void startConversationWithVendor(t.vendorId!, t.productId)}
                        className="rounded-xl bg-[#00a884] px-4 py-2 text-xs font-bold text-[#111b21] hover:bg-[#029676] flex items-center gap-1.5"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> Chat Product Seller
                      </button>
                    ) : (
                      <button
                        onClick={() => void handleEscalateProductChat(selectedProduct)}
                        className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
                      >
                        Chat Dispatch
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: FAQ & Knowledge Base */}
        {activeTab === 'kb' && (
          <div className="space-y-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search FAQs, Nexconn SDK, SLA, orders..."
                className="w-full rounded-full border border-zinc-800 bg-zinc-900 pl-10 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Interactive FAQ Accordion with Helpful Voting */}
              <div className="lg:col-span-7 space-y-3">
                <h2 className="text-lg font-bold text-white mb-2">Frequently Asked Questions</h2>
                {filteredFaqs.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className="rounded-2xl border border-zinc-800 bg-[#141418] overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-zinc-900/50 transition-colors"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                            {faq.category}
                          </span>
                          <h3 className="text-sm font-bold text-white mt-0.5">{faq.question}</h3>
                        </div>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 text-zinc-400 shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 border-t border-zinc-800/70 space-y-3">
                          <p className="text-xs text-zinc-300 leading-relaxed">{faq.answer}</p>
                          <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                            <span>Was this helpful?</span>
                            <button
                              onClick={() => void handleVoteFaq(faq.id, 'helpful')}
                              className={cn(
                                'inline-flex items-center gap-1 rounded-lg px-2 py-1 border border-zinc-800 hover:text-emerald-300',
                                votedFaqs[faq.id] === 'helpful' && 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              )}
                            >
                              <ThumbsUp className="h-3 w-3" /> {faq.helpful}
                            </button>
                            <button
                              onClick={() => void handleVoteFaq(faq.id, 'notHelpful')}
                              className={cn(
                                'inline-flex items-center gap-1 rounded-lg px-2 py-1 border border-zinc-800 hover:text-rose-300',
                                votedFaqs[faq.id] === 'notHelpful' && 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              )}
                            >
                              <ThumbsDown className="h-3 w-3" /> {faq.notHelpful}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Knowledge Base Articles */}
              <div className="lg:col-span-5 space-y-3">
                <h2 className="text-lg font-bold text-white mb-2">Knowledge Base Guides</h2>
                {filteredArticles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => setSelectedArticle(art)}
                    className="cursor-pointer rounded-2xl border border-zinc-800 bg-[#141418] p-4 hover:border-zinc-600 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span className="font-bold uppercase text-sky-400">{art.category}</span>
                      <span>
                        {art.readTime} · {art.views} views
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white flex items-start gap-2">
                      <FileText className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                      <span>{art.title}</span>
                    </h3>
                    <p className="text-xs text-zinc-400">{art.summary}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {art.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Article Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-[#141418] p-6 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase text-sky-400">
                  {selectedArticle.category} · {selectedArticle.readTime}
                </span>
                <h3 className="text-xl font-bold text-white mt-1">{selectedArticle.title}</h3>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-400">{selectedArticle.summary}</p>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-xs text-zinc-200 whitespace-pre-line leading-relaxed">
              {selectedArticle.content}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedArticle(null)}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedArticle(null);
                  if (selectedProduct) {
                    void handleContactProductSeller(selectedProduct);
                  } else {
                    setActiveTab('submit');
                  }
                }}
                className="rounded-xl bg-[#00a884] px-4 py-2 text-xs font-bold text-[#111b21] hover:bg-[#029676]"
              >
                {selectedProduct ? 'Chat Real-Time with Product Seller' : 'Submit Product Support Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom-Right Ticket Chat Launcher */}
      {myTickets.length > 0 && !chatTicketId && (
        <button
          onClick={() => {
            setChatTicketId(myTickets[0].ticketId);
            setEditingTicketReplyId(null);
            setTicketReplyText('');
          }}
          className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5 rounded-full bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-xl shadow-indigo-950/50 hover:bg-indigo-500 transition-all"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Ticket Chat ({myTickets[0].ticketId})</span>
          {totalAgentReplies > 0 && (
            <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-black text-zinc-950">
              {totalAgentReplies}
            </span>
          )}
        </button>
      )}

      {/* Interactive Ticket Conversation Modal (AES-GCM Encrypted + Attachments + Audio) */}
      {activeChatTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="flex h-[82vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-[#111116] text-zinc-100 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800 bg-[#16161d] px-5 py-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-400">
                    {activeChatTicket.ticketId}
                  </span>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                    {activeChatTicket.status.replace('_', ' ')}
                  </span>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase text-zinc-300">
                    {activeChatTicket.priority} · {activeChatTicket.slaDueHours}h SLA
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                    <Lock className="h-2.5 w-2.5" /> RSA-2048 E2EE
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{activeChatTicket.subject}</h3>
              </div>
              <button
                onClick={() => {
                  setChatTicketId(null);
                  setEditingTicketReplyId(null);
                  setTicketReplyText('');
                }}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Thread Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 p-5">
              {/* Original Ticket Submission Bubble */}
              <div className="flex justify-end">
                <div className="max-w-[82%] rounded-2xl rounded-br-sm border border-indigo-500/30 bg-indigo-950/60 px-4 py-3 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-4 text-[10px] text-indigo-300 font-semibold">
                    <span>{activeChatTicket.consumerName} (You) · Ticket Opened</span>
                    <span>{formatDate(activeChatTicket.createdAt)}</span>
                  </div>
                  <p className="text-zinc-100 whitespace-pre-wrap leading-relaxed">
                    {activeChatTicket.rsaEncrypted
                      ? decryptedTicketMap.__description__ || '[Decrypting RSA-2048 payload...]'
                      : activeChatTicket.description}
                  </p>
                </div>
              </div>

              {(activeChatTicket.replies || []).map((r) => {
                const isMine =
                  r.senderRole === 'consumer' || (user?.uid && r.senderId === user.uid);
                const displayText = r.deletedForEveryone
                  ? 'This message was recalled'
                  : r.encrypted || r.rsaEncrypted
                  ? decryptedTicketMap[r.id] || '[Decrypting RSA-2048 payload...]'
                  : r.message;

                return (
                  <div
                    key={r.id}
                    className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[82%] rounded-2xl px-4 py-3 text-xs space-y-2 border',
                        r.deletedForEveryone
                          ? 'bg-zinc-900/60 border-zinc-800 text-zinc-500 italic'
                          : isMine
                          ? 'rounded-br-sm bg-emerald-950/60 border-emerald-500/30 text-zinc-100'
                          : 'rounded-bl-sm bg-zinc-900 border-zinc-800 text-zinc-100'
                      )}
                    >
                      <div className="flex items-center justify-between gap-4 text-[10px] text-zinc-400">
                        <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                          {r.senderName}
                          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] uppercase text-zinc-300">
                            {r.senderRole.replace('_', ' ')}
                          </span>
                          {r.encrypted && !r.deletedForEveryone && (
                            <Lock className="h-2.5 w-2.5 text-amber-400" />
                          )}
                        </span>
                        <span>{formatDate(r.createdAt)}</span>
                      </div>

                      {r.audioUrl && !r.deletedForEveryone ? (
                        <AdminAudioPlayer src={r.audioUrl} />
                      ) : r.attachmentUrl && !r.deletedForEveryone ? (
                        <div className="space-y-1.5">
                          {/\.(png|jpe?g|gif|webp)$/i.test(
                            r.attachmentName || r.attachmentUrl
                          ) && (
                            <img
                              src={r.attachmentUrl}
                              alt={r.attachmentName || 'Attachment'}
                              className="max-h-44 rounded-lg border border-zinc-700 object-cover"
                            />
                          )}
                          <a
                            href={r.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-[11px] font-semibold text-sky-300 hover:bg-zinc-700"
                          >
                            <Download className="h-3.5 w-3.5" />
                            {r.attachmentName || 'Download Attachment'}
                          </a>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{displayText}</p>
                      )}

                      <div className="flex items-center justify-between gap-3 pt-0.5">
                        {r.editedAt && !r.deletedForEveryone && (
                          <span className="text-[10px] text-zinc-500 italic">(edited)</span>
                        )}
                        {isMine && !r.deletedForEveryone && !r.attachmentUrl && !r.audioUrl && (
                          <div className="flex items-center gap-2 ml-auto text-[10px] text-zinc-400">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTicketReplyId(r.id);
                                setTicketReplyText(displayText);
                              }}
                              className="hover:text-white inline-flex items-center gap-1"
                            >
                              <Pencil className="h-2.5 w-2.5" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleRecallTicketReply(r.id)}
                              className="hover:text-rose-400 inline-flex items-center gap-1"
                            >
                              <Ban className="h-2.5 w-2.5" /> Recall
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Composer */}
            <form
              onSubmit={handleSendOrEditTicketReply}
              className="border-t border-zinc-800 bg-[#16161d] p-4 space-y-2.5"
            >
              {editingTicketReplyId && (
                <div className="flex items-center justify-between rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-[11px] text-amber-200">
                  <span>Editing your reply</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTicketReplyId(null);
                      setTicketReplyText('');
                    }}
                    className="font-bold hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  ref={ticketFileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleUploadTicketAttachment}
                />
                <button
                  type="button"
                  disabled={isUploadingTicketFile}
                  onClick={() => ticketFileInputRef.current?.click()}
                  title="Upload attachment or voice note"
                  className="rounded-xl border border-zinc-700 bg-zinc-900 p-2.5 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isUploadingTicketFile ? (
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEncryptTicketReply((v) => !v)}
                  title="Toggle AES-GCM client-side E2E encryption"
                  className={cn(
                    'rounded-xl border px-2.5 py-2.5 text-[11px] font-bold flex items-center gap-1 transition-colors',
                    encryptTicketReply
                      ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-400'
                  )}
                >
                  <Lock className="h-3.5 w-3.5" />
                  {encryptTicketReply ? 'E2E' : 'Plain'}
                </button>
                <input
                  type="text"
                  value={ticketReplyText}
                  onChange={(e) => setTicketReplyText(e.target.value)}
                  placeholder="Write a reply on this ticket thread..."
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSendingTicketReply || !ticketReplyText.trim()}
                  className="rounded-xl bg-[#00a884] px-4 py-2.5 text-xs font-bold text-[#111b21] hover:bg-[#029676] disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSendingTicketReply ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  {editingTicketReplyId ? 'Save' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
