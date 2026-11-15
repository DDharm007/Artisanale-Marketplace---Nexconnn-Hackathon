import { Response } from 'express';
import { db } from '../../services/dataStore';
import { aiAgentService } from '../../services/aiAgentService';
import { nexconnService } from '../../services/nexconnService';
import { translationService } from '../../services/translationService';
import { AuthenticatedRequest } from '../../middleware/auth';
import { Conversation, Message, SupportTicket } from '../../../../shared';

export class ConversationController {
  private enrichConversation(conv: Conversation): Conversation {
    const vendor = db.findVendorById(conv.vendorId);
    const consumer = db.findUserById(conv.consumerId);
    const vendorOwner = vendor ? db.findUserById(vendor.ownerUid) : undefined;
    const vendorCustomerOrders = db.getOrders({
      consumerId: conv.consumerId,
      vendorId: conv.vendorId,
    });
    const latestOrderAddr = vendorCustomerOrders[0]?.addressSnapshot;
    const savedAddr =
      consumer?.addresses?.find((a) => a.isDefault) || consumer?.addresses?.[0] || latestOrderAddr;
    const addrParts = savedAddr
      ? [savedAddr.city, savedAddr.state, savedAddr.country].filter(Boolean).join(', ')
      : '';

    return {
      ...conv,
      consumerName: consumer?.displayName || conv.consumerName,
      consumerAvatar: consumer?.photoURL || conv.consumerAvatar,
      consumerEmail: consumer?.email || conv.consumerEmail,
      consumerPhone: consumer?.phoneNumber || savedAddr?.phone || conv.consumerPhone,
      consumerAddressSummary: addrParts || conv.consumerAddressSummary,
      consumerTotalOrders: vendorCustomerOrders.length,
      consumerTotalSpent: Number(
        vendorCustomerOrders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)
      ),
      vendorLogo: vendor?.logo || conv.vendorLogo,
      vendorOwnerUid: vendor?.ownerUid || conv.vendorOwnerUid,
      vendorAvailability: vendor?.availability || conv.vendorAvailability || 'online',
      consumerPublicKey: consumer?.rsaPublicKey || conv.consumerPublicKey,
      vendorPublicKey: vendorOwner?.rsaPublicKey || conv.vendorPublicKey,
      consumerPreferredLanguage: consumer?.preferredLanguage || conv.consumerPreferredLanguage || 'en',
      vendorPreferredLanguage: vendorOwner?.preferredLanguage || conv.vendorPreferredLanguage || 'en',
    };
  }

  private pickBestSupportAgent(preferredLanguage?: string) {
    const supportAgents = db.getUsers().filter((u) => u.role === 'support_agent');
    if (supportAgents.length === 0) return undefined;

    const allConvs = db.getAllConversations();
    const targetLang = preferredLanguage || 'en';

    const sorted = [...supportAgents].sort((a, b) => {
      const aLangMatch = a.preferredLanguage === targetLang ? 0 : 1;
      const bLangMatch = b.preferredLanguage === targetLang ? 0 : 1;
      if (aLangMatch !== bLangMatch) return aLangMatch - bLangMatch;
      const aLoad = allConvs.filter(
        (c) => c.assignedSupportAgentId === a.uid && c.status !== 'closed'
      ).length;
      const bLoad = allConvs.filter(
        (c) => c.assignedSupportAgentId === b.uid && c.status !== 'closed'
      ).length;
      return aLoad - bLoad;
    });

    return sorted[0];
  }

  private ensureEscalationTicket(
    conv: Conversation,
    reason: string,
    priority: 'medium' | 'high' | 'urgent' = 'high',
    assignedAgent?: { uid: string; displayName: string }
  ): SupportTicket {
    const existing = db
      .getSupportTickets()
      .find(
        (t) =>
          t.conversationId === conv.conversationId &&
          t.status !== 'resolved' &&
          t.status !== 'closed'
      );

    if (existing) {
      if (assignedAgent && !existing.assignedAgentId) {
        return (
          db.updateSupportTicket(existing.ticketId, {
            assignedAgentId: assignedAgent.uid,
            assignedAgentName: assignedAgent.displayName,
            status: 'in_progress',
          }) || existing
        );
      }
      return existing;
    }

    const consumer = db.findUserById(conv.consumerId);
    const ticket: SupportTicket = {
      ticketId: `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      consumerId: conv.consumerId,
      consumerName: conv.consumerName,
      consumerEmail: consumer?.email || 'customer@convocart.com',
      conversationId: conv.conversationId,
      orderId: conv.orderId,
      vendorId: conv.vendorId,
      assignedAgentId: assignedAgent?.uid || conv.assignedSupportAgentId,
      assignedAgentName: assignedAgent?.displayName || conv.assignedSupportAgentName,
      priority,
      status: assignedAgent || conv.assignedSupportAgentId ? 'in_progress' : 'open',
      category: 'Human Agent Escalation',
      subject: `Escalated Chat: ${conv.vendorBusinessName}${conv.productTitle ? ` — ${conv.productTitle}` : ''}`,
      description: reason,
      internalNotes: [],
      slaDueHours: priority === 'urgent' ? 4 : 12,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.addSupportTicket(ticket);
    return ticket;
  }

  public getConversations(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const list = db.getConversations(req.user.uid, req.user.role).map((c) => this.enrichConversation(c));
    res.json(list);
  }

  public getConversationById(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { conversationId } = req.params;
    const conversation = db.findConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(this.enrichConversation(conversation));
  }

  public getMessages(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { conversationId } = req.params;
    const conversation = db.findConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = db.getMessages(conversationId);
    res.json(messages);
  }

  public startConversation(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { vendorId: bodyVendorId, consumerId: bodyConsumerId, productId, orderId } = req.body;
    const targetVendorId = bodyVendorId || req.user.vendorId;

    if (!targetVendorId) {
      return res.status(400).json({ error: 'vendorId is required to start a conversation' });
    }

    const vendor = db.findVendorById(targetVendorId);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const consumerId = req.user.role === 'consumer' ? req.user.uid : bodyConsumerId;
    if (!consumerId) {
      return res.status(400).json({ error: 'consumerId is required when vendor initiates a conversation' });
    }
    const consumer = db.findUserById(consumerId);

    // Check if an existing conversation exists between this consumer and vendor for this product/order
    const existing = db.getAllConversations().find(
      (c) =>
        c.consumerId === consumerId &&
        c.vendorId === targetVendorId &&
        (!productId || c.productId === productId)
    );

    if (existing) {
      return res.json(this.enrichConversation(existing));
    }

    let productTitle: string | undefined;
    let productImage: string | undefined;
    if (productId) {
      const prod = db.findProductById(productId);
      if (prod) {
        productTitle = prod.title;
        productImage = prod.images[0];
      }
    }

    const vendorOwner = db.findUserById(vendor.ownerUid);
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newConv: Conversation = {
      conversationId,
      consumerId,
      consumerName: consumer?.displayName || req.user.displayName,
      consumerAvatar: consumer?.photoURL || req.user.photoURL,
      vendorId: vendor.vendorId,
      vendorBusinessName: vendor.businessName,
      vendorLogo: vendor.logo,
      vendorAvailability: vendor.availability,
      consumerPreferredLanguage: consumer?.preferredLanguage || 'en',
      vendorPreferredLanguage: vendorOwner?.preferredLanguage || 'en',
      productId,
      productTitle,
      productImage,
      orderId,
      status: 'active',
      aiHandlingEnabled: vendor.aiAgentEnabled,
      unreadCount: {
        [consumerId]: 0,
        [vendor.ownerUid]: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addConversation(newConv);

    // Initial greeting if AI agent is enabled and initiated by consumer
    if (vendor.aiAgentEnabled && req.user.role === 'consumer') {
      const config = db.getAIAgentConfig(vendor.vendorId);
      if (config) {
        const greetingMsg: Message = {
          id: `msg_${Date.now()}`,
          conversationId,
          senderId: `agent_${vendor.vendorId}`,
          senderName: config.agentName,
          senderRole: 'vendor',
          recipientId: consumerId,
          text: config.greetingMessage,
          type: 'text',
          metadata: {
            detectedLanguage: 'en',
            translatedText: { en: config.greetingMessage },
          },
          isAiGenerated: true,
          status: 'sent',
          createdAt: new Date().toISOString(),
        };
        db.addMessage(greetingMsg);
      }
    }

    res.status(201).json(this.enrichConversation(newConv));
  }

  public async sendMessage(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { conversationId } = req.params;
    const { text, type = 'text', mediaUrl, metadata, replyToMessageId, targetLanguage } = req.body;

    const conversation = db.findConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const vendor = db.findVendorById(conversation.vendorId);
    const consumer = db.findUserById(conversation.consumerId);
    const vendorOwner = vendor ? db.findUserById(vendor.ownerUid) : undefined;

    const recipientId =
      req.user.role === 'consumer'
        ? vendor?.ownerUid || conversation.vendorId
        : conversation.consumerId;

    const isRsaEncrypted = Boolean(metadata?.rsaEncrypted);
    const detectedLang = !isRsaEncrypted && text ? translationService.detectLanguage(text) : 'en';
    const recipientLang =
      targetLanguage ||
      (req.user.role === 'consumer'
        ? vendorOwner?.preferredLanguage || 'en'
        : consumer?.preferredLanguage || 'en');

    const translatedTextMap: Record<string, string> = isRsaEncrypted
      ? { ...(metadata?.translatedText || {}) }
      : {
          ...(metadata?.translatedText || {}),
          ...(text ? { [detectedLang]: text } : {}),
        };

    if (!isRsaEncrypted && text && type === 'text' && recipientLang && recipientLang !== detectedLang) {
      const tr = await translationService.translateText(text, recipientLang, detectedLang);
      translatedTextMap[recipientLang] = tr.translatedText;
    }

    const safeType = (type as string) === 'voice' ? 'audio' : type;

    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId,
      senderId: req.user.uid,
      senderName: req.user.displayName,
      senderRole: req.user.role,
      recipientId,
      text: text || '',
      type: safeType,
      mediaUrl: mediaUrl || metadata?.audioUrl || metadata?.fileUrl,
      metadata: {
        ...metadata,
        detectedLanguage: detectedLang,
        translatedText: translatedTextMap,
      },
      replyToMessageId,
      isAiGenerated: false,
      status: 'delivered',
      createdAt: new Date().toISOString(),
    };

    db.addMessage(message);

    // Ensure assigned support agent also sees unread increment when consumer or vendor replies
    if (
      conversation.assignedSupportAgentId &&
      conversation.assignedSupportAgentId !== req.user.uid &&
      conversation.assignedSupportAgentId !== recipientId
    ) {
      const updatedCounts = { ...(conversation.unreadCount || {}) };
      updatedCounts[conversation.assignedSupportAgentId] =
        (updatedCounts[conversation.assignedSupportAgentId] || 0) + 1;
      db.updateConversation(conversationId, { unreadCount: updatedCounts });
    }

    // Never attempt to read or run AI on RSA-2048 end-to-end encrypted ciphertexts
    let aiResponse: Message | null = null;
    if (!isRsaEncrypted && req.user.role === 'consumer' && type === 'text' && text) {
      if (conversation.aiHandlingEnabled && !conversation.assignedSupportAgentId && !conversation.escalatedToSupport) {
        const shouldRespond = aiAgentService.shouldAIRespond(conversation.vendorId);
        if (shouldRespond) {
          const aiResult = await aiAgentService.generateGroundedResponse(
            conversation.vendorId,
            text,
            {
              productId: conversation.productId,
              orderId: conversation.orderId,
              consumerId: conversation.consumerId,
              preferredLanguage: consumer?.preferredLanguage || detectedLang,
            }
          );

          const aiConfig = db.getAIAgentConfig(conversation.vendorId);
          const aiMsg: Message = {
            id: `msg_${Date.now() + 100}_${Math.random().toString(36).substring(2, 5)}`,
            conversationId,
            senderId: `agent_${conversation.vendorId}`,
            senderName: aiConfig?.agentName || 'AI Vendor Assistant',
            senderRole: 'vendor',
            recipientId: req.user.uid,
            text: aiResult.replyText,
            type: 'text',
            metadata: {
              detectedLanguage: aiResult.detectedLanguage || 'en',
              translatedText: aiResult.translatedReply || { en: aiResult.replyText },
            },
            isAiGenerated: true,
            status: 'delivered',
            createdAt: new Date(Date.now() + 100).toISOString(),
          };

          db.addMessage(aiMsg);
          aiResponse = aiMsg;

          if (aiResult.escalateToHuman) {
            const reason = aiResult.escalationReason || 'Escalated automatically by AI Vendor Assistant';
            const assignedAgent = this.pickBestSupportAgent(
              consumer?.preferredLanguage || conversation.consumerPreferredLanguage || detectedLang
            );
            const nowIso = new Date().toISOString();
            const updatedConv = db.updateConversation(conversationId, {
              status: 'escalated',
              escalatedToSupport: true,
              aiHandlingEnabled: false,
              escalationReason: reason,
              escalatedAt: nowIso,
              assignedSupportAgentId: assignedAgent?.uid,
              assignedSupportAgentName: assignedAgent?.displayName,
              supportAgentId: assignedAgent?.uid,
              dispatchedAt: assignedAgent ? nowIso : undefined,
            });
            if (updatedConv) {
              this.ensureEscalationTicket(updatedConv, reason, 'high', assignedAgent);
            }
          }
        }
      } else if (
        conversation.escalatedToSupport ||
        conversation.status === 'escalated' ||
        conversation.assignedSupportAgentId
      ) {
        // Ensure a human support specialist is assigned so the consumer never hits dead silence
        let specialistId = conversation.assignedSupportAgentId;
        let specialistName = conversation.assignedSupportAgentName;
        if (!specialistId) {
          const picked = this.pickBestSupportAgent(
            consumer?.preferredLanguage || conversation.consumerPreferredLanguage || detectedLang
          );
          if (picked) {
            specialistId = picked.uid;
            specialistName = picked.displayName;
            db.updateConversation(conversationId, {
              assignedSupportAgentId: specialistId,
              assignedSupportAgentName: specialistName,
              supportAgentId: specialistId,
              dispatchedAt: conversation.dispatchedAt || new Date().toISOString(),
            });
          }
        }

        const effectiveSpecialistId = specialistId || 'user_support_1';
        const effectiveSpecialistName = specialistName || 'Sarah Jenkins (Dispatch Specialist)';
        const activeConv = db.findConversationById(conversationId) || conversation;
        const ticket = this.ensureEscalationTicket(
          activeConv,
          conversation.escalationReason || 'Customer requested human specialist assistance',
          'high',
          { uid: effectiveSpecialistId, displayName: effectiveSpecialistName }
        );

        const order = conversation.orderId
          ? db.findOrderById(conversation.orderId)
          : db.getOrders({ consumerId: conversation.consumerId, vendorId: conversation.vendorId })[0];

        const recentConsumerTexts = db
          .getMessages(conversationId)
          .filter((m) => m.senderRole === 'consumer' && m.text)
          .slice(-4)
          .map((m) => m.text);

        const specialistReply = await aiAgentService.generateHumanSpecialistAutoReply({
          specialistName: effectiveSpecialistName,
          vendorBusinessName: conversation.vendorBusinessName,
          customerName: req.user.displayName || conversation.consumerName,
          customerMessage: text,
          preferredLanguage: consumer?.preferredLanguage || conversation.consumerPreferredLanguage || detectedLang,
          ticketId: ticket.ticketId,
          recentCustomerMessages: recentConsumerTexts,
          order,
          productTitle: conversation.productTitle,
        });

        const specialistMsg: Message = {
          id: `msg_${Date.now() + 120}_${Math.random().toString(36).substring(2, 5)}`,
          conversationId,
          senderId: effectiveSpecialistId,
          senderName: effectiveSpecialistName,
          senderRole: 'support_agent',
          recipientId: req.user.uid,
          text: specialistReply.replyText,
          type: 'text',
          metadata: {
            detectedLanguage: specialistReply.detectedLanguage,
            translatedText: specialistReply.translatedReply,
          },
          isAiGenerated: false,
          status: 'delivered',
          createdAt: new Date(Date.now() + 120).toISOString(),
        };

        db.addMessage(specialistMsg);
        aiResponse = specialistMsg;
      }
    }

    const freshConv = db.findConversationById(conversationId);
    res.status(201).json({
      sentMessage: message,
      aiReply: aiResponse,
      conversation: freshConv ? this.enrichConversation(freshConv) : undefined,
    });
  }

  public async translateMessage(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { conversationId, messageId } = req.params;
    const { targetLanguage = 'en' } = req.body;

    const message = db.findMessageById(conversationId, messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const existing = message.metadata?.translatedText?.[targetLanguage];
    if (existing) {
      return res.json({ message, translatedText: existing, targetLanguage });
    }

    const result = await translationService.translateText(
      message.text,
      targetLanguage,
      message.metadata?.detectedLanguage
    );

    const updated = db.updateMessage(messageId, {
      metadata: {
        ...(message.metadata || {}),
        detectedLanguage: message.metadata?.detectedLanguage || result.detectedSourceLanguage,
        translatedText: {
          ...(message.metadata?.translatedText || {}),
          [result.detectedSourceLanguage]: message.text,
          [targetLanguage]: result.translatedText,
        },
      },
    });

    res.json({
      message: updated,
      translatedText: result.translatedText,
      detectedSourceLanguage: result.detectedSourceLanguage,
      targetLanguage,
      provider: result.provider,
    });
  }

  public async translateAllMessages(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { conversationId } = req.params;
    const { targetLanguage = 'en', enableAutoTranslate } = req.body;

    const conversation = db.findConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (enableAutoTranslate !== undefined) {
      db.updateConversation(conversationId, { autoTranslateEnabled: Boolean(enableAutoTranslate) });
    }

    const messages = db.getMessages(conversationId);
    const updatedMessages: Message[] = [];

    for (const msg of messages) {
      if (!msg.text || msg.type !== 'text') {
        updatedMessages.push(msg);
        continue;
      }
      if (msg.metadata?.translatedText?.[targetLanguage]) {
        updatedMessages.push(msg);
        continue;
      }

      const result = await translationService.translateText(
        msg.text,
        targetLanguage,
        msg.metadata?.detectedLanguage
      );
      const updated = db.updateMessage(msg.id, {
        metadata: {
          ...(msg.metadata || {}),
          detectedLanguage: msg.metadata?.detectedLanguage || result.detectedSourceLanguage,
          translatedText: {
            ...(msg.metadata?.translatedText || {}),
            [result.detectedSourceLanguage]: msg.text,
            [targetLanguage]: result.translatedText,
          },
        },
      });
      updatedMessages.push(updated || msg);
    }

    res.json({
      conversationId,
      targetLanguage,
      messages: updatedMessages,
    });
  }

  public async translateDraftText(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { text, targetLanguage = 'en', sourceLanguage } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required' });
    }

    const result = await translationService.translateText(text, targetLanguage, sourceLanguage);
    res.json({
      originalText: text,
      targetLanguage,
      ...result,
    });
  }

  public async escalateConversation(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { conversationId } = req.params;
    const { reason = 'Customer requested live human specialist assistance', priority = 'high' } = req.body;

    const conversation = db.findConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const consumer = db.findUserById(conversation.consumerId);
    const consumerLang = consumer?.preferredLanguage || conversation.consumerPreferredLanguage || 'en';
    const assignedAgent = conversation.assignedSupportAgentId
      ? db.findUserById(conversation.assignedSupportAgentId) || this.pickBestSupportAgent(consumerLang)
      : this.pickBestSupportAgent(consumerLang);

    const nowIso = new Date().toISOString();
    const updatedConv = db.updateConversation(conversationId, {
      status: 'escalated',
      escalatedToSupport: true,
      aiHandlingEnabled: false,
      escalationReason: reason,
      escalatedAt: nowIso,
      assignedSupportAgentId: assignedAgent?.uid,
      assignedSupportAgentName: assignedAgent?.displayName,
      supportAgentId: assignedAgent?.uid,
      dispatchedAt: assignedAgent ? nowIso : undefined,
    });

    const ticket = this.ensureEscalationTicket(updatedConv || conversation, reason, priority, assignedAgent);

    const dispatchNotice = `🎧 Conversation escalated to the Human Agent Dispatch Center (Ticket #${ticket.ticketId})${
      assignedAgent ? ` — ${assignedAgent.displayName} has been assigned` : ''
    }. Reason: ${reason}`;
    const dispatchTranslated: Record<string, string> = { en: dispatchNotice };
    if (consumerLang !== 'en') {
      const tr = await translationService.translateText(dispatchNotice, consumerLang, 'en');
      dispatchTranslated[consumerLang] = tr.translatedText;
    }

    const systemMessage: Message = {
      id: `msg_${Date.now()}_esc`,
      conversationId,
      senderId: 'system_dispatch',
      senderName: 'ConvoCart Dispatch Center',
      senderRole: 'support_agent',
      recipientId: conversation.consumerId,
      text: dispatchNotice,
      type: 'text',
      metadata: {
        detectedLanguage: 'en',
        translatedText: dispatchTranslated,
      },
      status: 'delivered',
      createdAt: nowIso,
    };
    db.addMessage(systemMessage);

    let specialistGreeting: Message | undefined;
    if (assignedAgent) {
      const recentConsumerTexts = db
        .getMessages(conversationId)
        .filter((m) => m.senderRole === 'consumer' && m.text)
        .slice(-3)
        .map((m) => m.text);
      const lastCustomerText = recentConsumerTexts[recentConsumerTexts.length - 1] || reason;
      const order = conversation.orderId
        ? db.findOrderById(conversation.orderId)
        : db.getOrders({ consumerId: conversation.consumerId, vendorId: conversation.vendorId })[0];

      const replyData = await aiAgentService.generateHumanSpecialistAutoReply({
        specialistName: assignedAgent.displayName,
        vendorBusinessName: conversation.vendorBusinessName,
        customerName: conversation.consumerName,
        customerMessage: lastCustomerText,
        preferredLanguage: consumerLang,
        ticketId: ticket.ticketId,
        recentCustomerMessages: recentConsumerTexts,
        order,
        productTitle: conversation.productTitle,
      });

      specialistGreeting = {
        id: `msg_${Date.now() + 50}_sp`,
        conversationId,
        senderId: assignedAgent.uid,
        senderName: assignedAgent.displayName,
        senderRole: 'support_agent',
        recipientId: conversation.consumerId,
        text: replyData.replyText,
        type: 'text',
        metadata: {
          detectedLanguage: replyData.detectedLanguage,
          translatedText: replyData.translatedReply,
        },
        isAiGenerated: false,
        status: 'delivered',
        createdAt: new Date(Date.now() + 50).toISOString(),
      };
      db.addMessage(specialistGreeting);
    }

    res.json({
      conversation: this.enrichConversation(db.findConversationById(conversationId) || updatedConv || conversation),
      ticket,
      systemMessage,
      specialistGreeting,
    });
  }

  public dispatchConversation(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!['support_agent', 'admin', 'vendor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only support agents, vendors, or admins can dispatch conversations' });
    }

    const { conversationId } = req.params;
    const { action = 'claim', agentId } = req.body as {
      action?: 'claim' | 'auto' | 'transfer_vendor' | 'resolve';
      agentId?: string;
    };

    const conversation = db.findConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    let updatedConv = conversation;
    let noticeText = '';

    if (action === 'claim' || action === 'auto') {
      let targetAgent = req.user;
      if (action === 'auto') {
        const convLang = conversation.consumerPreferredLanguage || conversation.vendorPreferredLanguage || 'en';
        const bestAgent = agentId ? db.findUserById(agentId) : this.pickBestSupportAgent(convLang);
        targetAgent = bestAgent || req.user;
      } else if (agentId) {
        targetAgent = db.findUserById(agentId) || req.user;
      }

      updatedConv =
        db.updateConversation(conversationId, {
          assignedSupportAgentId: targetAgent.uid,
          assignedSupportAgentName: targetAgent.displayName,
          supportAgentId: targetAgent.uid,
          dispatchedAt: new Date().toISOString(),
          status: 'active',
          escalatedToSupport: true,
          aiHandlingEnabled: false,
        }) || conversation;

      const linkedTicket = db
        .getSupportTickets()
        .find((t) => t.conversationId === conversationId && t.status !== 'closed');
      if (linkedTicket) {
        db.updateSupportTicket(linkedTicket.ticketId, {
          assignedAgentId: targetAgent.uid,
          assignedAgentName: targetAgent.displayName,
          status: 'in_progress',
        });
      }

      noticeText = `🎧 Human Support Specialist ${targetAgent.displayName} has joined this conversation via Dispatch Center.`;
    } else if (action === 'transfer_vendor') {
      updatedConv =
        db.updateConversation(conversationId, {
          assignedSupportAgentId: undefined,
          assignedSupportAgentName: undefined,
          status: 'active',
          escalatedToSupport: false,
          aiHandlingEnabled: false,
        }) || conversation;
      noticeText = `🏪 Conversation transferred directly to ${conversation.vendorBusinessName}'s store team.`;
    } else if (action === 'resolve') {
      updatedConv =
        db.updateConversation(conversationId, {
          status: 'active',
          escalatedToSupport: false,
        }) || conversation;
      const linkedTicket = db
        .getSupportTickets()
        .find((t) => t.conversationId === conversationId && t.status !== 'resolved');
      if (linkedTicket) {
        db.updateSupportTicket(linkedTicket.ticketId, { status: 'resolved' });
      }
      noticeText = `✅ Support dispatch resolved by ${req.user.displayName}. You can continue messaging anytime.`;
    }

    const systemMessage: Message = {
      id: `msg_${Date.now()}_dsp`,
      conversationId,
      senderId: req.user.uid,
      senderName: 'ConvoCart Dispatch Center',
      senderRole: 'support_agent',
      recipientId: conversation.consumerId,
      text: noticeText,
      type: 'text',
      metadata: {
        detectedLanguage: 'en',
        translatedText: { en: noticeText },
      },
      status: 'delivered',
      createdAt: new Date().toISOString(),
    };
    db.addMessage(systemMessage);

    res.json({
      conversation: this.enrichConversation(updatedConv),
      systemMessage,
    });
  }

  public async updateConversationSettings(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { conversationId } = req.params;
    const {
      aiHandlingEnabled,
      autoTranslateEnabled,
      consumerPreferredLanguage,
      vendorPreferredLanguage,
      status,
    } = req.body as {
      aiHandlingEnabled?: boolean;
      autoTranslateEnabled?: boolean;
      consumerPreferredLanguage?: string;
      vendorPreferredLanguage?: string;
      status?: Conversation['status'];
    };

    const conversation = db.findConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const updates: Partial<Conversation> = {};
    if (typeof aiHandlingEnabled === 'boolean') {
      updates.aiHandlingEnabled = aiHandlingEnabled;
      // When switching back to AI Concierge mode explicitly, exit escalated lockout unless closed
      if (aiHandlingEnabled) {
        updates.escalatedToSupport = false;
        updates.status = 'active';
        updates.assignedSupportAgentId = undefined;
        updates.assignedSupportAgentName = undefined;
      }
    }
    if (typeof autoTranslateEnabled === 'boolean') {
      updates.autoTranslateEnabled = autoTranslateEnabled;
    }
    if (consumerPreferredLanguage) {
      updates.consumerPreferredLanguage = consumerPreferredLanguage;
    }
    if (vendorPreferredLanguage) {
      updates.vendorPreferredLanguage = vendorPreferredLanguage;
    }
    if (status) {
      updates.status = status;
    }

    const updatedConv = db.updateConversation(conversationId, updates) || conversation;

    let systemMessage: Message | undefined;
    if (typeof aiHandlingEnabled === 'boolean' && aiHandlingEnabled !== conversation.aiHandlingEnabled) {
      const modeText = aiHandlingEnabled
        ? `🤖 ${req.user.displayName} re-enabled AI Store Concierge auto-assistance for this chat.`
        : `👤 ${req.user.displayName} switched this chat to direct Human Seller / Live Takeover mode.`;
      systemMessage = {
        id: `msg_${Date.now()}_mode`,
        conversationId,
        senderId: req.user.uid,
        senderName: 'ConvoCart System',
        senderRole: req.user.role,
        recipientId: req.user.role === 'consumer' ? conversation.vendorId : conversation.consumerId,
        text: modeText,
        type: 'text',
        metadata: {
          detectedLanguage: 'en',
          translatedText: { en: modeText },
        },
        status: 'delivered',
        createdAt: new Date().toISOString(),
      };
      db.addMessage(systemMessage);
    }

    res.json({
      conversation: this.enrichConversation(db.findConversationById(conversationId) || updatedConv),
      systemMessage,
    });
  }

  public markAsRead(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { conversationId } = req.params;
    const conversation = db.findConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.unreadCount) {
      conversation.unreadCount[req.user.uid] = 0;
      if (req.user.vendorId) {
        conversation.unreadCount[req.user.vendorId] = 0;
      }
      db.updateConversation(conversationId, { unreadCount: conversation.unreadCount });
    }

    res.json({ success: true });
  }

  public getCallToken(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { targetUserId, isVideo = false } = req.body;

    const session = nexconnService.generateCallSessionToken(
      req.user.uid,
      targetUserId,
      Boolean(isVideo)
    );

    res.json(session);
  }

  public async editMessage(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { conversationId, messageId } = req.params;
    const { text } = req.body as { text?: string };

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Edited message text is required' });
    }

    const conversation = db.findConversationById(conversationId);
    const existing = db.findMessageById(conversationId, messageId);
    if (!conversation || !existing) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (
      existing.senderId !== req.user.uid &&
      req.user.role !== 'admin' &&
      req.user.role !== 'support_agent'
    ) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }

    const trimmed = text.trim();
    const isRsaEdit = Boolean(req.body?.metadata?.rsaEncrypted);
    let updated: Message | undefined;

    if (isRsaEdit) {
      updated = db.updateMessage(messageId, {
        text: trimmed,
        metadata: {
          ...(existing.metadata || {}),
          ...(req.body.metadata || {}),
          isEdited: true,
          editedAt: new Date().toISOString(),
        },
      });
    } else {
      const detectedLang = translationService.detectLanguage(trimmed);
      const translatedTextMap: Record<string, string> = {
        [detectedLang]: trimmed,
      };

      const targetLangs = Array.from(
        new Set([
          conversation.consumerPreferredLanguage || 'en',
          conversation.vendorPreferredLanguage || 'en',
          'en',
        ])
      ).filter((l) => l !== detectedLang);

      for (const lang of targetLangs) {
        const tr = await translationService.translateText(trimmed, lang, detectedLang);
        translatedTextMap[lang] = tr.translatedText;
      }

      updated = db.updateMessage(messageId, {
        text: trimmed,
        metadata: {
          ...(existing.metadata || {}),
          detectedLanguage: detectedLang,
          translatedText: translatedTextMap,
          isEdited: true,
          editedAt: new Date().toISOString(),
        },
      });
    }

    if (conversation.lastMessage?.timestamp === existing.createdAt) {
      db.updateConversation(conversationId, {
        lastMessage: {
          ...conversation.lastMessage,
          text: isRsaEdit ? '🔒 RSA-2048 Encrypted Message' : trimmed,
        },
      });
    }

    res.json({ message: updated });
  }

  public deleteMessage(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { conversationId, messageId } = req.params;
    const conversation = db.findConversationById(conversationId);
    const existing = db.findMessageById(conversationId, messageId);
    if (!conversation || !existing) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (
      existing.senderId !== req.user.uid &&
      req.user.role !== 'admin' &&
      req.user.role !== 'support_agent'
    ) {
      return res.status(403).json({ error: 'You can only recall your own messages' });
    }

    const recalledText = 'This message was recalled';
    const updated = db.updateMessage(messageId, {
      text: recalledText,
      mediaUrl: undefined,
      metadata: {
        ...(existing.metadata || {}),
        audioUrl: undefined,
        fileUrl: undefined,
        isDeleted: true,
        translatedText: { en: recalledText },
      },
    });

    if (conversation.lastMessage?.timestamp === existing.createdAt) {
      db.updateConversation(conversationId, {
        lastMessage: {
          ...conversation.lastMessage,
          text: recalledText,
        },
      });
    }

    res.json({ message: updated });
  }
}

export const conversationController = new ConversationController();
