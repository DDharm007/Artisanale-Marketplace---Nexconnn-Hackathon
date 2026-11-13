import { Response } from 'express';
import { db } from '../../services/dataStore';
import { aiAgentService } from '../../services/aiAgentService';
import { AuthenticatedRequest } from '../../middleware/auth';
import { AIAgentConfig } from '../../../../shared';

export class AIAgentController {
  public getConfig(req: AuthenticatedRequest, res: Response) {
    if (!req.user || req.user.role !== 'vendor') {
      return res.status(403).json({ error: 'Only vendors can access AI agent configuration' });
    }

    const vendor = db.findVendorByOwnerUid(req.user.uid);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }

    let config = db.getAIAgentConfig(vendor.vendorId);
    if (!config) {
      // Default initial config
      config = {
        vendorId: vendor.vendorId,
        enabled: true,
        agentName: `${vendor.businessName} Assistant`,
        avatarUrl: vendor.logo,
        greetingMessage: `Hello! Welcome to ${vendor.businessName}. How can I assist you with products or orders today?`,
        personality: 'friendly',
        supportedLanguages: ['en'],
        businessHours: {
          enabled: false,
          start: '09:00',
          end: '18:00',
          timezone: 'UTC',
        },
        responseStyle: 'friendly',
        faqs: [
          {
            question: 'What is your shipping timeframe?',
            answer: vendor.businessPolicies.shipping,
          },
          {
            question: 'What is your return policy?',
            answer: vendor.businessPolicies.returns,
          },
        ],
        shippingPolicy: vendor.businessPolicies.shipping,
        returnPolicy: vendor.businessPolicies.returns,
        warrantyInfo: vendor.businessPolicies.warranty,
        escalationRules: ['refund', 'damaged', 'manager', 'speak to human'],
        humanTakeoverActive: false,
        updatedAt: new Date().toISOString(),
      };
      db.setAIAgentConfig(vendor.vendorId, config);
    }

    res.json(config);
  }

  public updateConfig(req: AuthenticatedRequest, res: Response) {
    if (!req.user || req.user.role !== 'vendor') {
      return res.status(403).json({ error: 'Only vendors can update AI agent configuration' });
    }

    const vendor = db.findVendorByOwnerUid(req.user.uid);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }

    const existing = db.getAIAgentConfig(vendor.vendorId);
    const updated: AIAgentConfig = {
      ...(existing || {}),
      ...req.body,
      vendorId: vendor.vendorId,
      updatedAt: new Date().toISOString(),
    };

    db.setAIAgentConfig(vendor.vendorId, updated);
    // Also sync vendor document aiAgentEnabled flag
    if (req.body.enabled !== undefined) {
      db.updateVendor(vendor.vendorId, { aiAgentEnabled: req.body.enabled });
    }

    res.json({ message: 'AI Agent configuration updated successfully', config: updated });
  }

  public takeover(req: AuthenticatedRequest, res: Response) {
    if (!req.user || req.user.role !== 'vendor') {
      return res.status(403).json({ error: 'Only vendors can trigger human takeover' });
    }

    const vendor = db.findVendorByOwnerUid(req.user.uid);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }

    const { conversationId, takeoverActive = true } = req.body;

    const config = db.getAIAgentConfig(vendor.vendorId);
    if (config) {
      config.humanTakeoverActive = Boolean(takeoverActive);
      db.setAIAgentConfig(vendor.vendorId, config);
    }

    if (conversationId) {
      db.updateConversation(conversationId, {
        aiHandlingEnabled: !takeoverActive,
        status: takeoverActive ? 'active' : 'active',
      });
    }

    res.json({
      message: takeoverActive
        ? 'Human seller has successfully taken over the conversation. AI auto-replies are paused.'
        : 'AI agent resumed auto-answering.',
      humanTakeoverActive: Boolean(takeoverActive),
    });
  }

  public async previewResponse(req: AuthenticatedRequest, res: Response) {
    if (!req.user || req.user.role !== 'vendor') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const vendor = db.findVendorByOwnerUid(req.user.uid);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const { query, productId } = req.body;
    const response = await aiAgentService.generateGroundedResponse(
      vendor.vendorId,
      query || 'Tell me about your best product',
      { productId }
    );

    res.json(response);
  }
}

export const aiAgentController = new AIAgentController();
