import { Response } from 'express';
import { db } from '../../services/dataStore';
import { firebaseService } from '../../services/firebaseService';
import { AuthenticatedRequest } from '../../middleware/auth';
import {
  SupportTicket,
  SupportTicketReply,
  InternalNote,
  DispatchAgentInfo,
  DispatchOverviewStats,
} from '../../../../shared';

export class SupportController {
  public getDispatchOverview(req: AuthenticatedRequest, res: Response) {
    if (!req.user || !['support_agent', 'admin', 'vendor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only support agents, admins, or vendors can access dispatch overview' });
    }

    const allConvs = db.getAllConversations();
    const allTickets = db.getSupportTickets();
    const allUsers = db.getUsers();
    const allVendors = db.getVendors();

    const enrichedConvs = allConvs
      .map((c) => {
        const vendor = db.findVendorById(c.vendorId);
        const consumer = db.findUserById(c.consumerId);
        const vendorOwner = vendor ? db.findUserById(vendor.ownerUid) : undefined;
        return {
          ...c,
          vendorLogo: vendor?.logo || c.vendorLogo,
          vendorAvailability: vendor?.availability || c.vendorAvailability || 'online',
          consumerPreferredLanguage: consumer?.preferredLanguage || c.consumerPreferredLanguage || 'en',
          vendorPreferredLanguage: vendorOwner?.preferredLanguage || c.vendorPreferredLanguage || 'en',
        };
      })
      .filter((c) => {
        if (req.user!.role === 'vendor') {
          const myVendor = db.findVendorByOwnerUid(req.user!.uid);
          return myVendor && c.vendorId === myVendor.vendorId;
        }
        return true;
      })
      .sort((a, b) => {
        // Prioritize escalated unassigned conversations at top of Dispatch Queue
        const aScore = a.status === 'escalated' && !a.assignedSupportAgentId ? 3 : a.escalatedToSupport ? 2 : 1;
        const bScore = b.status === 'escalated' && !b.assignedSupportAgentId ? 3 : b.escalatedToSupport ? 2 : 1;
        if (aScore !== bScore) return bScore - aScore;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

    const agents: DispatchAgentInfo[] = allUsers
      .filter((u) => u.role === 'support_agent' || u.role === 'vendor')
      .map((u) => {
        const vendor = u.role === 'vendor' ? allVendors.find((v) => v.ownerUid === u.uid) : undefined;
        const activeChats = allConvs.filter(
          (c) =>
            (c.assignedSupportAgentId === u.uid || (vendor && c.vendorId === vendor.vendorId)) &&
            c.status !== 'closed'
        ).length;
        const assignedTickets = allTickets.filter(
          (t) => t.assignedAgentId === u.uid && t.status !== 'resolved' && t.status !== 'closed'
        ).length;

        const langMap: Record<string, string[]> = {
          user_support_1: ['en', 'es', 'fr'],
          user_support_2: ['ja', 'en', 'zh'],
        };

        return {
          uid: u.uid,
          displayName: u.displayName,
          email: u.email,
          role: u.role,
          photoURL: u.photoURL,
          preferredLanguage: u.preferredLanguage || 'en',
          supportedLanguages: langMap[u.uid] || [u.preferredLanguage || 'en', 'en'],
          availability: vendor ? vendor.availability : 'online',
          activeChats,
          assignedTickets,
        };
      });

    const waitingInQueueCount = enrichedConvs.filter(
      (c) => (c.status === 'escalated' || c.escalatedToSupport) && !c.assignedSupportAgentId
    ).length;
    const activeDispatchedCount = enrichedConvs.filter(
      (c) => Boolean(c.assignedSupportAgentId) && c.status !== 'closed'
    ).length;
    const escalatedChatsCount = enrichedConvs.filter(
      (c) => c.status === 'escalated' || c.escalatedToSupport
    ).length;
    const resolvedTodayCount = allTickets.filter((t) => t.status === 'resolved').length;
    const avgSlaHours =
      allTickets.length > 0
        ? Number((allTickets.reduce((acc, t) => acc + t.slaDueHours, 0) / allTickets.length).toFixed(1))
        : 12;
    const onlineAgentsCount = agents.filter(
      (a) => a.role === 'support_agent' || a.availability === 'online'
    ).length;
    const multiLanguageChatsCount = enrichedConvs.filter((c) => {
      const msgs = db.getMessages(c.conversationId);
      return (
        c.autoTranslateEnabled ||
        c.consumerPreferredLanguage !== c.vendorPreferredLanguage ||
        msgs.some((m) => Object.keys(m.metadata?.translatedText || {}).length > 1)
      );
    }).length;

    const stats: DispatchOverviewStats = {
      escalatedChatsCount,
      waitingInQueueCount,
      activeDispatchedCount,
      resolvedTodayCount,
      avgSlaHours,
      onlineAgentsCount,
      multiLanguageChatsCount,
    };

    res.json({
      stats,
      escalatedConversations: enrichedConvs,
      agents,
      firebaseStatus: firebaseService.getStatus(),
    });
  }

  public getKnowledgeBase(_req: AuthenticatedRequest, res: Response) {
    res.json({
      faqs: db.getFAQs(),
      articles: db.getKBArticles(),
      slaTimelines: [
        { priority: 'urgent', label: 'Urgent', responseWindow: '~2–4 hours', channel: 'Instant Human Dispatch & Live Call' },
        { priority: 'high', label: 'High', responseWindow: '~8–12 hours', channel: 'Priority Multilingual Queue' },
        { priority: 'medium', label: 'Medium', responseWindow: '~24 hours', channel: 'Standard Ticket & AI Concierge' },
        { priority: 'low', label: 'Low', responseWindow: '~48 hours', channel: 'General Inquiries & Feedback' },
      ],
      firebaseStatus: firebaseService.getStatus(),
    });
  }

  public voteFAQ(req: AuthenticatedRequest, res: Response) {
    const { faqId } = req.params;
    const { vote = 'helpful' } = req.body as { vote?: 'helpful' | 'notHelpful' };
    const updated = db.voteFAQ(faqId, vote === 'notHelpful' ? 'notHelpful' : 'helpful');
    if (!updated) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    res.json(updated);
  }

  public createFAQ(req: AuthenticatedRequest, res: Response) {
    if (!req.user || !['support_agent', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only support agents or admins can add FAQs' });
    }
    const { question, answer, category = 'General' } = req.body as {
      question?: string;
      answer?: string;
      category?: string;
    };
    if (!question?.trim() || !answer?.trim()) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }
    const created = db.addFAQ({
      id: `faq_${Date.now()}`,
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim(),
      helpful: 0,
      notHelpful: 0,
    });
    res.status(201).json(created);
  }

  public updateFAQ(req: AuthenticatedRequest, res: Response) {
    if (!req.user || !['support_agent', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only support agents or admins can update FAQs' });
    }
    const { faqId } = req.params;
    const { question, answer, category } = req.body as {
      question?: string;
      answer?: string;
      category?: string;
    };
    const updated = db.updateFAQ(faqId, {
      ...(question !== undefined ? { question: question.trim() } : {}),
      ...(answer !== undefined ? { answer: answer.trim() } : {}),
      ...(category !== undefined ? { category: category.trim() } : {}),
    });
    if (!updated) return res.status(404).json({ error: 'FAQ not found' });
    res.json(updated);
  }

  public deleteFAQ(req: AuthenticatedRequest, res: Response) {
    if (!req.user || !['support_agent', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only support agents or admins can delete FAQs' });
    }
    const ok = db.deleteFAQ(req.params.faqId);
    if (!ok) return res.status(404).json({ error: 'FAQ not found' });
    res.json({ deleted: true });
  }

  public createArticle(req: AuthenticatedRequest, res: Response) {
    if (!req.user || !['support_agent', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only support agents or admins can create KB articles' });
    }
    const { title, summary, content, category = 'Getting Started', tags = [], readTime = '5 min' } =
      req.body as {
        title?: string;
        summary?: string;
        content?: string;
        category?: string;
        tags?: string[] | string;
        readTime?: string;
      };
    if (!title?.trim() || !summary?.trim() || !content?.trim()) {
      return res.status(400).json({ error: 'Title, summary, and content are required' });
    }
    const tagList = Array.isArray(tags)
      ? tags
      : String(tags)
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
    const created = db.addKBArticle({
      id: `kb_${Date.now()}`,
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      category: category.trim(),
      tags: tagList,
      readTime: readTime.trim() || '5 min',
      views: 0,
      author: req.user.displayName || 'Admin',
      updatedAt: new Date().toISOString(),
    });
    res.status(201).json(created);
  }

  public updateArticle(req: AuthenticatedRequest, res: Response) {
    if (!req.user || !['support_agent', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only support agents or admins can update KB articles' });
    }
    const { title, summary, content, category, tags, readTime } = req.body as {
      title?: string;
      summary?: string;
      content?: string;
      category?: string;
      tags?: string[] | string;
      readTime?: string;
    };
    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title.trim();
    if (summary !== undefined) updates.summary = summary.trim();
    if (content !== undefined) updates.content = content.trim();
    if (category !== undefined) updates.category = category.trim();
    if (readTime !== undefined) updates.readTime = readTime.trim();
    if (tags !== undefined) {
      updates.tags = Array.isArray(tags)
        ? tags
        : String(tags)
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
    }
    const updated = db.updateKBArticle(req.params.articleId, updates);
    if (!updated) return res.status(404).json({ error: 'Article not found' });
    res.json(updated);
  }

  public deleteArticle(req: AuthenticatedRequest, res: Response) {
    if (!req.user || !['support_agent', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only support agents or admins can delete KB articles' });
    }
    const ok = db.deleteKBArticle(req.params.articleId);
    if (!ok) return res.status(404).json({ error: 'Article not found' });
    res.json({ deleted: true });
  }

  public getTickets(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status, priority, assignedOnly } = req.query;

    let tickets: SupportTicket[] = [];
    if (req.user.role === 'consumer') {
      tickets = db.getSupportTickets({ consumerId: req.user.uid });
    } else if (req.user.role === 'vendor') {
      const myVendor = db.findVendorByOwnerUid(req.user.uid);
      tickets = db
        .getSupportTickets({ status: status as string })
        .filter((t) => t.consumerId === req.user!.uid || (myVendor && t.vendorId === myVendor.vendorId));
    } else if (req.user.role === 'support_agent' || req.user.role === 'admin') {
      tickets = db.getSupportTickets({
        assignedAgentId: assignedOnly === 'true' ? req.user.uid : undefined,
        status: status as string,
      });
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (priority) {
      tickets = tickets.filter((t) => t.priority === priority);
    }

    const enriched = tickets.map((t) => {
      const vendor = t.vendorId ? db.findVendorById(t.vendorId) : undefined;
      return {
        ...t,
        vendorOwnerUid: t.vendorOwnerUid || vendor?.ownerUid,
      };
    });

    res.json(enriched);
  }

  public getTicketById(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { ticketId } = req.params;
    const rawTicket = db.findSupportTicketById(ticketId);
    if (!rawTicket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    const vendor = rawTicket.vendorId ? db.findVendorById(rawTicket.vendorId) : undefined;
    const ticket = {
      ...rawTicket,
      vendorOwnerUid: rawTicket.vendorOwnerUid || vendor?.ownerUid,
    };

    // Consumer can only view their own ticket and internal notes are stripped for consumers!
    if (req.user.role === 'consumer') {
      if (ticket.consumerId !== req.user.uid) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      const safeTicket = { ...ticket, internalNotes: [] };
      return res.json(safeTicket);
    }

    res.json(ticket);
  }

  public createTicket(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      subject,
      category,
      description,
      orderId,
      conversationId,
      productId,
      priority = 'medium',
      rsaEncrypted,
      encryptionAlgorithm,
      rsaForRecipient,
      rsaForSender,
      rsaRecipientUid,
      rsaSenderUid,
    } = req.body;
    const ticketId = `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    let resolvedProductId: string | undefined = typeof productId === 'string' && productId.trim() ? productId.trim() : undefined;
    let resolvedProductTitle: string | undefined;
    let resolvedVendorId: string | undefined;
    let resolvedVendorOwnerUid: string | undefined;

    if (resolvedProductId) {
      const product = db.findProductById(resolvedProductId);
      if (product) {
        resolvedProductTitle = product.title;
        resolvedVendorId = product.vendorId;
        resolvedVendorOwnerUid = db.findVendorById(product.vendorId)?.ownerUid;
      }
    }

    if (conversationId) {
      const conv = db.findConversationById(conversationId);
      if (conv) {
        resolvedVendorId = resolvedVendorId || conv.vendorId;
        resolvedProductId = resolvedProductId || conv.productId;
        resolvedProductTitle = resolvedProductTitle || conv.productTitle;
        if (!resolvedVendorOwnerUid && conv.vendorId) {
          resolvedVendorOwnerUid = db.findVendorById(conv.vendorId)?.ownerUid;
        }
      }
    }

    const newTicket: SupportTicket = {
      ticketId,
      consumerId: req.user.uid,
      consumerName: req.user.displayName,
      consumerEmail: req.user.email,
      conversationId,
      orderId,
      productId: resolvedProductId,
      productTitle: resolvedProductTitle,
      vendorId: resolvedVendorId,
      vendorOwnerUid: resolvedVendorOwnerUid,
      priority,
      status: 'open',
      category,
      subject,
      description,
      ...(rsaEncrypted
        ? {
            rsaEncrypted: true,
            encryptionAlgorithm,
            rsaForRecipient,
            rsaForSender,
            rsaRecipientUid,
            rsaSenderUid,
          }
        : {}),
      internalNotes: [],
      slaDueHours: priority === 'urgent' ? 4 : priority === 'high' ? 12 : 24,
      firebaseSynced: firebaseService.getStatus().connected,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addSupportTicket(newTicket);
    res.status(201).json(newTicket);
  }

  public updateTicket(req: AuthenticatedRequest, res: Response) {
    if (!req.user || (req.user.role !== 'support_agent' && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Only support agents or admins can update tickets' });
    }

    const { ticketId } = req.params;
    const { status, priority, assignToMe } = req.body;

    const ticket = db.findSupportTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const updates: Partial<SupportTicket> = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (assignToMe) {
      updates.assignedAgentId = req.user.uid;
      updates.assignedAgentName = req.user.displayName;
    }

    const updated = db.updateSupportTicket(ticketId, updates);
    res.json(updated);
  }

  public addInternalNote(req: AuthenticatedRequest, res: Response) {
    if (!req.user || (req.user.role !== 'support_agent' && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Only authorized agents can add internal notes' });
    }

    const { ticketId } = req.params;
    const { note } = req.body;

    if (!note || note.trim().length === 0) {
      return res.status(400).json({ error: 'Note text cannot be empty' });
    }

    const ticket = db.findSupportTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const internalNote: InternalNote = {
      id: `note_${Date.now()}`,
      authorId: req.user.uid,
      authorName: req.user.displayName,
      note,
      createdAt: new Date().toISOString(),
    };

    ticket.internalNotes.push(internalNote);
    const updated = db.updateSupportTicket(ticketId, {
      internalNotes: ticket.internalNotes,
    });

    res.status(201).json(updated);
  }

  public addTicketReply(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { ticketId } = req.params;
    const ticket = db.findSupportTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    if (
      req.user.role === 'consumer' &&
      ticket.consumerId !== req.user.uid
    ) {
      return res.status(403).json({ error: 'Unauthorized to reply to this ticket' });
    }

    const {
      message,
      encrypted,
      rsaEncrypted,
      encryptionAlgorithm,
      rsaForRecipient,
      rsaForSender,
      rsaRecipientUid,
      rsaSenderUid,
      attachmentUrl,
      attachmentName,
      audioUrl,
    } = req.body as {
      message?: string;
      encrypted?: boolean;
      rsaEncrypted?: boolean;
      encryptionAlgorithm?: 'RSA-OAEP-256' | 'RSA-OAEP-256+AES-256-GCM' | 'AES-GCM';
      rsaForRecipient?: string;
      rsaForSender?: string;
      rsaRecipientUid?: string;
      rsaSenderUid?: string;
      attachmentUrl?: string;
      attachmentName?: string;
      audioUrl?: string;
    };

    if (!message?.trim() && !attachmentUrl && !audioUrl) {
      return res.status(400).json({ error: 'Reply message or attachment is required' });
    }

    const reply: SupportTicketReply = {
      id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      senderId: req.user.uid,
      senderName: req.user.displayName,
      senderRole: req.user.role,
      isAdminOrAgent: req.user.role === 'support_agent' || req.user.role === 'admin',
      message: (message || '').trim(),
      encrypted: Boolean(encrypted || rsaEncrypted),
      ...(rsaEncrypted
        ? {
            rsaEncrypted: true,
            encryptionAlgorithm,
            rsaForRecipient,
            rsaForSender,
            rsaRecipientUid,
            rsaSenderUid,
          }
        : {}),
      ...(attachmentUrl ? { attachmentUrl } : {}),
      ...(attachmentName ? { attachmentName } : {}),
      ...(audioUrl ? { audioUrl } : {}),
      createdAt: new Date().toISOString(),
    };

    const updated = db.addSupportTicketReply(ticketId, reply);
    res.status(201).json(updated);
  }

  public updateTicketReply(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { ticketId, replyId } = req.params;
    const ticket = db.findSupportTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    const targetReply = (ticket.replies || []).find((r) => r.id === replyId);
    if (!targetReply) {
      return res.status(404).json({ error: 'Reply not found' });
    }
    const isStaff = req.user.role === 'support_agent' || req.user.role === 'admin';
    if (!isStaff && targetReply.senderId !== req.user.uid) {
      return res.status(403).json({ error: 'Cannot edit or recall another user reply' });
    }

    const {
      message,
      deletedForEveryone,
      rsaEncrypted,
      encryptionAlgorithm,
      rsaForRecipient,
      rsaForSender,
      rsaRecipientUid,
      rsaSenderUid,
    } = req.body as {
      message?: string;
      deletedForEveryone?: boolean;
      rsaEncrypted?: boolean;
      encryptionAlgorithm?: 'RSA-OAEP-256' | 'RSA-OAEP-256+AES-256-GCM' | 'AES-GCM';
      rsaForRecipient?: string;
      rsaForSender?: string;
      rsaRecipientUid?: string;
      rsaSenderUid?: string;
    };

    const updated = db.updateSupportTicketReply(ticketId, replyId, {
      ...(deletedForEveryone
        ? {
            deletedForEveryone: true,
            message: 'This message was deleted',
            encrypted: false,
            rsaEncrypted: false,
            rsaForRecipient: undefined,
            rsaForSender: undefined,
          }
        : {
            message: (message ?? targetReply.message).trim(),
            ...(rsaEncrypted
              ? {
                  encrypted: true,
                  rsaEncrypted: true,
                  encryptionAlgorithm,
                  rsaForRecipient,
                  rsaForSender,
                  rsaRecipientUid,
                  rsaSenderUid,
                }
              : {}),
            editedAt: new Date().toISOString(),
          }),
    });
    res.json(updated);
  }

  public deleteTicket(req: AuthenticatedRequest, res: Response) {
    if (!req.user || !['support_agent', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only support agents or admins can delete tickets' });
    }
    const ok = db.deleteSupportTicket(req.params.ticketId);
    if (!ok) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ deleted: true });
  }
}

export const supportController = new SupportController();
