import { db } from './dataStore';
import { ENV } from '../config/env';
import { translationService } from './translationService';
import { Product, AIAgentConfig, Order } from '../../../shared';

export interface AIResponseResult {
  replyText: string;
  isAiGenerated: boolean;
  escalateToHuman: boolean;
  escalationReason?: string;
  matchedProductId?: string;
  detectedLanguage?: string;
  translatedReply?: Record<string, string>;
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
   * Grounded knowledge retrieval & AI generation with multilingual awareness
   */
  public async generateGroundedResponse(
    vendorId: string,
    customerMessage: string,
    context?: { productId?: string; orderId?: string; consumerId?: string; preferredLanguage?: string }
  ): Promise<AIResponseResult> {
    const vendor = db.findVendorById(vendorId);
    const config = db.getAIAgentConfig(vendorId);
    const detectedLang = translationService.detectLanguage(customerMessage);
    const targetLang = context?.preferredLanguage || detectedLang || 'en';

    // Translate non-English customer query to English internally for accurate grounded matching
    let normalizedQuery = customerMessage;
    if (detectedLang !== 'en') {
      const tr = await translationService.translateText(customerMessage, 'en', detectedLang);
      normalizedQuery = tr.translatedText || customerMessage;
    }

    const finalize = async (res: AIResponseResult): Promise<AIResponseResult> => {
      res.detectedLanguage = 'en';
      res.translatedReply = { en: res.replyText };
      if (targetLang && targetLang !== 'en') {
        const translated = await translationService.translateText(res.replyText, targetLang, 'en');
        res.translatedReply[targetLang] = translated.translatedText;
      }
      return res;
    };

    if (!vendor || !config) {
      return finalize({
        replyText: 'Thank you for reaching out. A human specialist has been notified and will assist you shortly.',
        isAiGenerated: true,
        escalateToHuman: true,
      });
    }

    const lowerMsg = normalizedQuery.toLowerCase();
    const vendorProducts = db.getProducts({ vendorId });

    // 1. Check strict escalation triggers (refunds, cancellations, returns, defects, human request)
    const isPolicyQuestion =
      lowerMsg.includes('return policy') ||
      lowerMsg.includes('shipping policy') ||
      lowerMsg.includes('warranty') ||
      lowerMsg.includes('what is your return');

    const escalationTriggers = [
      'refund',
      'cancel',
      "don't want",
      'dont want',
      'do not want',
      'no longer want',
      'money back',
      'wrong item',
      'wrong product',
      'return my',
      'want to return',
      'need to return',
      'send back',
      'scam',
      'fraud',
      'stolen',
      'lost package',
      'missing item',
      'human',
      'real person',
      'support agent',
      'live agent',
      'speak to someone',
      'talk to someone',
      'manager',
      'supervisor',
      'lawyer',
      'chargeback',
      'dispute',
      'damaged',
      'defective',
      'broken',
      'not working',
      'complaint',
      'unsatisfied',
      'talk to seller',
      ...config.escalationRules.map((r) => r.toLowerCase()),
    ];

    if (!isPolicyQuestion) {
      for (const trigger of escalationTriggers) {
        if (lowerMsg.includes(trigger)) {
          return finalize({
            replyText: `I understand your request regarding "${trigger}". As an AI assistant, I cannot approve refunds, cancellations, or modify live transactions directly. I have marked this conversation as high priority and dispatched it to ${vendor.businessName} and our Human Agent Dispatch Center for immediate personal assistance.`,
            isAiGenerated: true,
            escalateToHuman: true,
            escalationReason: `Customer requested action requiring human authorization: ${trigger}`,
          });
        }
      }
    }

    // 1.5 Check live Order & Tracking inquiries from DataStore
    if (
      lowerMsg.includes('order') ||
      lowerMsg.includes('track') ||
      lowerMsg.includes('package') ||
      lowerMsg.includes('status')
    ) {
      let order: Order | undefined;
      if (context?.orderId) {
        order = db.findOrderById(context.orderId);
      } else if (context?.consumerId) {
        const consumerOrders = db.getOrders({ consumerId: context.consumerId, vendorId });
        order = consumerOrders[0];
      }
      if (order) {
        return finalize({
          replyText: `[${config.agentName}]: Your order #${order.orderId} is currently "${order.orderStatus.replace(
            '_',
            ' '
          )}". ${order.shippingStatus}${
            order.trackingNumber ? ` (Tracking: ${order.trackingNumber} via ${order.shippingCarrier || 'Carrier'})` : ''
          }. Let me know if you need to modify, cancel, or escalate this order to a live specialist!`,
          isAiGenerated: true,
          escalateToHuman: false,
        });
      }
    }

    // 2. Retrieve matched product context
    let matchedProduct: Product | undefined;
    if (context?.productId) {
      matchedProduct = db.findProductById(context.productId);
    }
    if (!matchedProduct) {
      matchedProduct = vendorProducts.find((p) => {
        const titleLower = p.title.toLowerCase();
        const skuLower = p.sku.toLowerCase();

        if (lowerMsg.includes(titleLower) || (lowerMsg.length > 3 && titleLower.includes(lowerMsg))) return true;
        if (lowerMsg.includes(skuLower)) return true;

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
          return finalize({
            replyText: `[${config.agentName}]: ${faq.answer}`,
            isAiGenerated: true,
            escalateToHuman: false,
          });
        }
      }
    }

    // 3.5 Bulk / Discount / Custom Quote requests
    if (
      lowerMsg.includes('bulk') ||
      lowerMsg.includes('wholesale') ||
      lowerMsg.includes('discount') ||
      lowerMsg.includes('cheaper') ||
      lowerMsg.includes('best price') ||
      lowerMsg.includes('negotiate') ||
      lowerMsg.includes('offer') ||
      lowerMsg.includes('quote') ||
      lowerMsg.includes('custom')
    ) {
      const refProduct = matchedProduct || vendorProducts[0];
      return finalize({
        replyText: `[${config.agentName}]: At ${vendor.businessName}, we offer tiered pricing: 5% off orders of 2+ units and 12% off 5+ units${
          refProduct ? ` (e.g., on ${refProduct.title} at $${refProduct.price.toFixed(2)})` : ''
        }. Reply with the quantity you need or switch to Live Seller mode so the store owner can send you an instant in-chat Payment Request card!`,
        isAiGenerated: true,
        escalateToHuman: false,
        matchedProductId: refProduct?.productId,
      });
    }

    // 4. Product-specific specification / price / availability queries
    if (matchedProduct) {
      if (lowerMsg.includes('price') || lowerMsg.includes('cost')) {
        const finalPrice = matchedProduct.discount > 0
          ? matchedProduct.price * (1 - matchedProduct.discount / 100)
          : matchedProduct.price;
        return finalize({
          replyText: `[${config.agentName}]: The ${matchedProduct.title} is currently priced at $${finalPrice.toFixed(2)}${
            matchedProduct.discount > 0 ? ` (which includes a ${matchedProduct.discount}% store discount off the original $${matchedProduct.price})` : ''
          }. In stock: ${matchedProduct.stock} units available.`,
          isAiGenerated: true,
          escalateToHuman: false,
          matchedProductId: matchedProduct.productId,
        });
      }

      if (lowerMsg.includes('stock') || lowerMsg.includes('available')) {
        return finalize({
          replyText: `[${config.agentName}]: We currently have ${matchedProduct.stock} units of ${matchedProduct.title} in stock and ready to ship.`,
          isAiGenerated: true,
          escalateToHuman: false,
          matchedProductId: matchedProduct.productId,
        });
      }

      for (const [key, val] of Object.entries(matchedProduct.specifications)) {
        if (lowerMsg.includes(key.toLowerCase())) {
          return finalize({
            replyText: `[${config.agentName}]: Regarding the ${key} for ${matchedProduct.title}: ${val}.`,
            isAiGenerated: true,
            escalateToHuman: false,
            matchedProductId: matchedProduct.productId,
          });
        }
      }
    }

    // 4.5 Catalog / Product Recommendations / "What do you sell"
    if (
      lowerMsg.includes('recommend') ||
      lowerMsg.includes('product') ||
      lowerMsg.includes('catalog') ||
      lowerMsg.includes('sell') ||
      lowerMsg.includes('show me') ||
      lowerMsg.includes('what do you have') ||
      lowerMsg.includes('options')
    ) {
      const topList = vendorProducts
        .slice(0, 3)
        .map((p) => `${p.title} ($${p.price.toFixed(2)}, ${p.stock} in stock)`)
        .join(' · ');
      return finalize({
        replyText: topList
          ? `[${config.agentName}]: Here are our top items at ${vendor.businessName}: ${topList}. Ask me for specs on any item or tap "Human Agent" anytime for bespoke order help.`
          : `[${config.agentName}]: ${vendor.description}`,
        isAiGenerated: true,
        escalateToHuman: false,
        matchedProductId: vendorProducts[0]?.productId,
      });
    }

    // 4.6 Payment / Checkout guidance
    if (
      lowerMsg.includes('pay') ||
      lowerMsg.includes('payment') ||
      lowerMsg.includes('checkout') ||
      lowerMsg.includes('invoice') ||
      lowerMsg.includes('buy')
    ) {
      return finalize({
        replyText: `[${config.agentName}]: You can add items to your cart for standard checkout, or ask the seller for an in-chat Payment Request card with a custom total right here in this thread.`,
        isAiGenerated: true,
        escalateToHuman: false,
        matchedProductId: matchedProduct?.productId || vendorProducts[0]?.productId,
      });
    }

    // 5. Shipping or Return policy questions
    if (lowerMsg.includes('shipping') || lowerMsg.includes('deliver') || lowerMsg.includes('delivery')) {
      return finalize({
        replyText: `[${config.agentName}]: Our shipping policy: ${config.shippingPolicy || vendor.businessPolicies.shipping}`,
        isAiGenerated: true,
        escalateToHuman: false,
      });
    }

    if (lowerMsg.includes('return') || lowerMsg.includes('exchange') || lowerMsg.includes('warranty')) {
      return finalize({
        replyText: `[${config.agentName}]: Our policy: ${config.returnPolicy || vendor.businessPolicies.returns}. Warranty: ${config.warrantyInfo || vendor.businessPolicies.warranty}`,
        isAiGenerated: true,
        escalateToHuman: false,
      });
    }

    // 5.5 Conversational greetings & check-ins (never repeat the initial greeting verbatim)
    const cleanWords = lowerMsg.replace(/[^\w\s]/g, '').trim();
    const isGreeting =
      ['hi', 'hello', 'hey', 'namaste', 'hola', 'konnichiwa', 'yo', 'sup', 'help'].includes(cleanWords) ||
      lowerMsg.startsWith('hi ') ||
      lowerMsg.startsWith('hello ') ||
      lowerMsg.includes('good morning') ||
      lowerMsg.includes('good afternoon') ||
      lowerMsg.includes('good evening') ||
      lowerMsg.includes('are you there');

    if (isGreeting) {
      const featured = vendorProducts[0];
      return finalize({
        replyText: `[${config.agentName}]: Hi there! I'm online and ready to help with anything at ${vendor.businessName}${
          featured ? ` — such as our featured ${featured.title} ($${featured.price.toFixed(2)})` : ''
        }. Ask about product specs, live order status, bulk quotes, or click "Human Agent" to connect directly with our dispatch team.`,
        isAiGenerated: true,
        escalateToHuman: false,
        matchedProductId: featured?.productId,
      });
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
Specs: ${JSON.stringify(matchedProduct.specifications)}` : `Catalog Summary: ${vendorProducts
          .slice(0, 3)
          .map((p) => `${p.title} ($${p.price})`)
          .join(', ')}`}

Customer Message: "${normalizedQuery}"

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
            return finalize({
              replyText: `[${config.agentName} (AI)]: ${candidateText.trim()}`,
              isAiGenerated: true,
              escalateToHuman: false,
            });
          }
        }
      } catch (err) {
        console.warn('[AIAgent] Gemini API error, falling back to local grounded reasoning:', err);
      }
    }

    // 7. Contextual grounded fallback (never repeat the canned greeting verbatim)
    const catalogPreview = vendorProducts
      .slice(0, 2)
      .map((p) => `${p.title} ($${p.price.toFixed(2)})`)
      .join(' and ');
    return finalize({
      replyText: `[${config.agentName}]: Got it! Regarding your message at ${vendor.businessName}${
        catalogPreview ? ` (featuring ${catalogPreview})` : ''
      } — ${config.shippingPolicy || vendor.businessPolicies.shipping}. Let me know if you want pricing details, order tracking, a custom quote, or tap "Human Agent" to chat with our live dispatch specialist.`,
      isAiGenerated: true,
      escalateToHuman: false,
    });
  }

  /**
   * Generates an immediate, context-aware multilingual response from the assigned Human Support Specialist
   * whenever a consumer sends a message in an escalated / dispatched thread so the chat is never silent.
   */
  public async generateHumanSpecialistAutoReply(params: {
    specialistName: string;
    vendorBusinessName: string;
    customerName: string;
    customerMessage: string;
    preferredLanguage?: string;
    ticketId?: string;
    recentCustomerMessages?: string[];
    order?: Order;
    productTitle?: string;
  }): Promise<{
    replyText: string;
    detectedLanguage: string;
    translatedReply: Record<string, string>;
  }> {
    const detectedLang = translationService.detectLanguage(params.customerMessage);
    const targetLang = params.preferredLanguage || detectedLang || 'en';

    let normalizedQuery = params.customerMessage;
    if (detectedLang !== 'en') {
      const tr = await translationService.translateText(params.customerMessage, 'en', detectedLang);
      normalizedQuery = tr.translatedText || params.customerMessage;
    }

    const combinedContext = `${normalizedQuery} ${(params.recentCustomerMessages || []).join(' ')}`.toLowerCase();
    const lower = normalizedQuery.toLowerCase().trim();
    const firstName = (params.customerName || 'there').split(' ')[0];
    const refLabel = params.order
      ? `Order #${params.order.orderId}`
      : params.productTitle || `your inquiry with ${params.vendorBusinessName}`;

    let replyEn = '';

    if (
      lower.includes("don't want") ||
      lower.includes('dont want') ||
      lower.includes('do not want') ||
      lower.includes('cancel') ||
      lower.includes('return') ||
      lower.includes('refund') ||
      lower.includes('money back') ||
      lower.includes('wrong') ||
      lower.includes('broken') ||
      lower.includes('damaged') ||
      lower.includes('defective')
    ) {
      replyEn = `Hi ${firstName}, I'm ${params.specialistName} from ConvoCart Human Support Dispatch${
        params.ticketId ? ` (Ticket #${params.ticketId})` : ''
      }. I've reviewed your request for ${refLabel} and initiated a full cancellation / prepaid return authorization with ${
        params.vendorBusinessName
      }. Please confirm whether you prefer a full refund to your original payment method or store credit, and I'll finalize it right now.`;
    } else if (['hi', 'hello', 'hey', 'namaste', 'hola', 'yo'].includes(lower.replace(/[^\w]/g, ''))) {
      const hasPriorCancelIntent =
        combinedContext.includes("don't want") ||
        combinedContext.includes('dont want') ||
        combinedContext.includes('cancel') ||
        combinedContext.includes('refund') ||
        combinedContext.includes('return');

      replyEn = hasPriorCancelIntent
        ? `Hi ${firstName}! ${params.specialistName} here from Human Dispatch${
            params.ticketId ? ` (Ticket #${params.ticketId})` : ''
          }. I see you mentioned earlier that you don't want / wish to return ${refLabel}. Would you like me to process a full cancellation & refund right away?`
        : `Hi ${firstName}! I'm ${params.specialistName}, your assigned Human Support Specialist${
            params.ticketId ? ` (Ticket #${params.ticketId})` : ''
          }. I'm live on this thread with ${params.vendorBusinessName} — how can I help you today?`;
    } else if (lower.includes('order') || lower.includes('track') || lower.includes('shipping')) {
      replyEn = params.order
        ? `Hi ${firstName}, ${params.specialistName} here. Your order #${params.order.orderId} is currently "${params.order.orderStatus.replace(
            '_',
            ' '
          )}" (${params.order.shippingStatus}${
            params.order.trackingNumber ? `, tracking ${params.order.trackingNumber}` : ''
          }). Let me know if you want to reroute, hold, or cancel this shipment.`
        : `Hi ${firstName}, ${params.specialistName} here. I've pulled up your account with ${params.vendorBusinessName}. Could you confirm your order ID or email so I can update your shipment or refund status right away?`;
    } else {
      replyEn = `Hi ${firstName}, ${params.specialistName} here from Human Dispatch${
        params.ticketId ? ` (Ticket #${params.ticketId})` : ''
      }. I've noted "${normalizedQuery}" regarding ${refLabel} and I'm coordinating directly with ${
        params.vendorBusinessName
      } to resolve this for you right away. Feel free to share any order number or preference below.`;
    }

    const translatedReply: Record<string, string> = { en: replyEn };
    if (targetLang && targetLang !== 'en') {
      const tr = await translationService.translateText(replyEn, targetLang, 'en');
      translatedReply[targetLang] = tr.translatedText;
    }

    return {
      replyText: replyEn,
      detectedLanguage: 'en',
      translatedReply,
    };
  }
}

export const aiAgentService = new AIAgentService();
