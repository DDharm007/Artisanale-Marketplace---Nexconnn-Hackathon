import { Response } from 'express';
import { db } from '../../services/dataStore';
import { aiAgentService } from '../../services/aiAgentService';
import { nexconnService } from '../../services/nexconnService';
import { AuthenticatedRequest } from '../../middleware/auth';
import { Conversation, Message } from '../../../../shared';

export class ConversationController {
  public getConversations(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const list = db.getConversations(req.user.uid, req.user.role);
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

    res.json(conversation);
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

    const { vendorId, productId, orderId } = req.body;
    if (!vendorId) {
      return res.status(400).json({ error: 'vendorId is required to start a conversation' });
    }

    const vendor = db.findVendorById(vendorId);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Check if an existing conversation exists between this consumer and vendor for this product/order
    const existing = db.getAllConversations().find(
      (c) =>
        c.consumerId === req.user!.uid &&
        c.vendorId === vendorId &&
        (!productId || c.productId === productId)
    );

    if (existing) {
      return res.json(existing);
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

    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newConv: Conversation = {
      conversationId,
      consumerId: req.user.uid,
      consumerName: req.user.displayName,
      consumerAvatar: req.user.photoURL,
      vendorId: vendor.vendorId,
      vendorBusinessName: vendor.businessName,
      productId,
      productTitle,
      productImage,
      orderId,
      status: 'active',
      aiHandlingEnabled: vendor.aiAgentEnabled,
      unreadCount: {
        [req.user.uid]: 0,
        [vendor.ownerUid]: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addConversation(newConv);

    // Initial greeting if AI agent is enabled
    if (vendor.aiAgentEnabled) {
      const config = db.getAIAgentConfig(vendor.vendorId);
      if (config) {
        const greetingMsg: Message = {
          id: `msg_${Date.now()}`,
          conversationId,
          senderId: `agent_${vendor.vendorId}`,
          senderName: config.agentName,
          senderRole: 'vendor',
          recipientId: req.user.uid,
          text: config.greetingMessage,
          type: 'text',
          isAiGenerated: true,
          status: 'sent',
          createdAt: new Date().toISOString(),
        };
        db.addMessage(greetingMsg);
      }
    }

    res.status(201).json(newConv);
  }

  public async sendMessage(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { conversationId } = req.params;
    const { text, type = 'text', mediaUrl, metadata, replyToMessageId } = req.body;

    const conversation = db.findConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const vendor = db.findVendorById(conversation.vendorId);
    const recipientId = req.user.role === 'consumer' ? (vendor?.ownerUid || conversation.vendorId) : conversation.consumerId;

    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId,
      senderId: req.user.uid,
      senderName: req.user.displayName,
      senderRole: req.user.role,
      recipientId,
      text: text || '',
      type,
      mediaUrl,
      metadata,
      replyToMessageId,
      isAiGenerated: false,
      status: 'delivered',
      createdAt: new Date().toISOString(),
    };

    db.addMessage(message);

    // If consumer sent a message, evaluate AI Vendor auto-response
    let aiResponse: any = null;
    if (req.user.role === 'consumer' && conversation.aiHandlingEnabled) {
      const shouldRespond = aiAgentService.shouldAIRespond(conversation.vendorId);
      if (shouldRespond) {
        const aiResult = await aiAgentService.generateGroundedResponse(
          conversation.vendorId,
          text,
          { productId: conversation.productId, orderId: conversation.orderId }
        );

        const aiMsg: Message = {
          id: `msg_${Date.now() + 100}`,
          conversationId,
          senderId: `agent_${conversation.vendorId}`,
          senderName: 'AI Vendor Assistant',
          senderRole: 'vendor',
          recipientId: req.user.uid,
          text: aiResult.replyText,
          type: 'text',
          isAiGenerated: true,
          status: 'delivered',
          createdAt: new Date(Date.now() + 100).toISOString(),
        };

        db.addMessage(aiMsg);
        aiResponse = aiMsg;

        if (aiResult.escalateToHuman) {
          db.updateConversation(conversationId, {
            status: 'escalated',
            escalatedToSupport: true,
          });
        }
      }
    }

    res.status(201).json({
      sentMessage: message,
      aiReply: aiResponse,
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
      db.updateConversation(conversationId, { unreadCount: conversation.unreadCount });
    }

    res.json({ success: true });
  }

  public getCallToken(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { conversationId } = req.params;
    const { targetUserId, isVideo = false } = req.body;

    const session = nexconnService.generateCallSessionToken(
      req.user.uid,
      targetUserId,
      Boolean(isVideo)
    );

    res.json(session);
  }
}

export const conversationController = new ConversationController();
