import { db } from './dataStore';
import { ENV } from '../config/env';
import { Product, AIAgentConfig, Message } from '../../../shared';

export interface AIResponseResult {
  replyText: string;
  isAiGenerated: boolean;
  escalateToHuman: boolean;
  escalationReason?: string;
  matchedProductId?: string;
}

export class AIAgentService {
  /**
   * Evaluates if vendor is offline/away and AI agent is active and not taken over by human
   */
  public shouldAIRespond(vendorId: string): boolean {
    const vendor = db.findVendorById(vendorId);
    if (!vendor) return false;

    const config = db.getAIAgentConfig(vendorId);
    if (!config || !config.enabled) return false;

    // If human seller has activated takeover, AI does NOT intervene
    if (config.humanTakeoverActive) return false;

    // If vendor is offline or away, AI takes over
    if (vendor.availability === 'offline' || vendor.availability === 'away') {
      return true;
    }

    // Check business hours if configured
    if (config.businessHours.enabled) {
      const now = new Date();
      const currentHour = now.getUTCHours();
      const [startH] = config.businessHours.start.split(':').map(Number);
      const [endH] = config.businessHours.end.split(':').map(Number);

      // Outside business hours -> AI responds
      if (currentHour < startH || currentHour >= endH) {
        return true;
      }
    }

    return true; // Default auto-assist for customer satisfaction
  }

  /**
   * Grounded knowledge retrieval & AI generation
   */
  public async generateGroundedResponse(
    vendorId: string,
    customerMessage: string,
    context?: { productId?: string; orderId?: string }
  ): Promise<AIResponseResult> {
    const vendor = db.findVendorById(vendorId);
    const config = db.getAIAgentConfig(vendorId);

    if (!vendor || !config) {
      return {
        replyText: 'Thank you for reaching out. The seller has been notified and will get back to you shortly.',
        isAiGenerated: true,
        escalateToHuman: true,
      };
    }

    const lowerMsg = customerMessage.toLowerCase();

    // 1. Check strict escalation triggers (refunds, human request, dispute, anger)
    const escalationTriggers = [
      'refund',
      'cancel my order',
      'scam',
      'human',
      'real person',
      'manager',
      'dispute',
      'damaged',
      'defective',
      'talk to seller',
      ...config.escalationRules.map((r) => r.toLowerCase()),
    ];

    for (const trigger of escalationTriggers) {
      if (lowerMsg.includes(trigger)) {
        return {
          replyText: `I understand your request regarding "${trigger}". As an AI assistant, I cannot approve refunds or modify live transactions directly. I have marked this conversation as high priority and escalated it directly to ${vendor.businessName}'s store manager for immediate personal assistance.`,
          isAiGenerated: true,
          escalateToHuman: true,
          escalationReason: `Customer requested action requiring human authorization: ${trigger}`,
        };
      }
    }

    // 2. Retrieve matched product context
    let matchedProduct: Product | undefined;
    if (context?.productId) {
      matchedProduct = db.findProductById(context.productId);
    }
    if (!matchedProduct) {
      // Search vendor products by matching significant tokens in message
      const vendorProducts = db.getProducts({ vendorId });
      matchedProduct = vendorProducts.find((p) => {
        const titleLower = p.title.toLowerCase();
        const brandLower = p.brand.toLowerCase();
        const skuLower = p.sku.toLowerCase();

        // Exact substring check either way
        if (lowerMsg.includes(titleLower) || titleLower.includes(lowerMsg)) return true;
        if (lowerMsg.includes(skuLower)) return true;

        // Check if key product title tokens appear in message
        const tokens = titleLower.split(' ').filter((w) => w.length > 3);
        const matchCount = tokens.filter((t) => lowerMsg.includes(t)).length;
        return matchCount >= 2;
      });
    }

    // 3. Match Store FAQs
    if (config.faqs && config.faqs.length > 0) {
      for (const faq of config.faqs) {
        const qWords = faq.question.toLowerCase().split(' ').filter((w) => w.length > 3);
        const matchCount = qWords.filter((w) => lowerMsg.includes(w)).length;
        if (matchCount >= 2 || lowerMsg.includes(faq.question.toLowerCase())) {
          return {
            replyText: `[${config.agentName}]: ${faq.answer}`,
            isAiGenerated: true,
            escalateToHuman: false,
          };
        }
      }
    }

    // 4. Product-specific specification / price / availability queries
    if (matchedProduct) {
      if (lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('discount')) {
        const finalPrice = matchedProduct.discount > 0
          ? matchedProduct.price * (1 - matchedProduct.discount / 100)
          : matchedProduct.price;
        return {
          replyText: `[${config.agentName}]: The ${matchedProduct.title} is currently priced at $${finalPrice.toFixed(2)}${
            matchedProduct.discount > 0 ? ` (which includes a ${matchedProduct.discount}% store discount off the original $${matchedProduct.price})` : ''
          }. In stock: ${matchedProduct.stock} units available.`,
          isAiGenerated: true,
          escalateToHuman: false,
          matchedProductId: matchedProduct.productId,
        };
      }

      if (lowerMsg.includes('stock') || lowerMsg.includes('available')) {
        return {
          replyText: `[${config.agentName}]: We currently have ${matchedProduct.stock} units of ${matchedProduct.title} in stock and ready to ship.`,
          isAiGenerated: true,
          escalateToHuman: false,
          matchedProductId: matchedProduct.productId,
        };
      }

      // Check specifications
      for (const [key, val] of Object.entries(matchedProduct.specifications)) {
        if (lowerMsg.includes(key.toLowerCase())) {
          return {
            replyText: `[${config.agentName}]: Regarding the ${key} for ${matchedProduct.title}: ${val}.`,
            isAiGenerated: true,
            escalateToHuman: false,
            matchedProductId: matchedProduct.productId,
          };
        }
      }
    }

    // 5. Shipping or Return policy questions
    if (lowerMsg.includes('shipping') || lowerMsg.includes('deliver') || lowerMsg.includes('delivery')) {
      return {
        replyText: `[${config.agentName}]: Our shipping policy: ${config.shippingPolicy || vendor.businessPolicies.shipping}`,
        isAiGenerated: true,
        escalateToHuman: false,
      };
    }

    if (lowerMsg.includes('return') || lowerMsg.includes('exchange') || lowerMsg.includes('warranty')) {
      return {
        replyText: `[${config.agentName}]: Our policy: ${config.returnPolicy || vendor.businessPolicies.returns}. Warranty: ${config.warrantyInfo || vendor.businessPolicies.warranty}`,
        isAiGenerated: true,
        escalateToHuman: false,
      };
    }

    // 6. External Gemini LLM call if configured
    if (ENV.GEMINI_API_KEY) {
      try {
        const prompt = `You are ${config.agentName}, an AI assistant representing the vendor "${vendor.businessName}".
Rules:
1. ONLY answer using verified facts provided below.
2. NEVER invent inventory, specs, prices, or promise unverified delivery dates.
3. NEVER approve refunds or confirm private financial transactions.
4. If you do not have verified data, say you will notify the seller to follow up.

Vendor Policies:
Shipping: ${config.shippingPolicy}
Returns: ${config.returnPolicy}
Warranty: ${config.warrantyInfo}

${matchedProduct ? `Selected Product:
Title: ${matchedProduct.title}
Price: $${matchedProduct.price} (Discount: ${matchedProduct.discount}%)
Stock: ${matchedProduct.stock}
Description: ${matchedProduct.description}
Specs: ${JSON.stringify(matchedProduct.specifications)}` : ''}

Customer Message: "${customerMessage}"

Provide a concise, helpful, grounded response:`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ENV.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = (await geminiRes.json()) as any;
          const candidateText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            return {
              replyText: `[${config.agentName} (AI)]: ${candidateText.trim()}`,
              isAiGenerated: true,
              escalateToHuman: false,
            };
          }
        }
      } catch (err) {
        console.warn('[AIAgent] Gemini API error, falling back to local grounded reasoning:', err);
      }
    }

    // 7. General grounded fallback
    return {
      replyText: `[${config.agentName}]: Hello! Thanks for reaching out to ${vendor.businessName}. ${config.greetingMessage} If you have specific questions about product specifications, shipping, or returns, feel free to ask!`,
      isAiGenerated: true,
      escalateToHuman: false,
    };
  }
}

export const aiAgentService = new AIAgentService();
