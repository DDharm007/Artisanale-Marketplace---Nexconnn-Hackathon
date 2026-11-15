import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  UserProfile,
  Vendor,
  Product,
  Cart,
  Order,
  Conversation,
  Message,
  SupportTicket,
  SupportTicketReply,
  SupportFAQ,
  KnowledgeBaseArticle,
  AIAgentConfig,
  PaymentTransaction,
  DEFAULT_CATEGORIES,
} from '../../../shared';
import { firebaseService } from './firebaseService';

const DATA_FILE_PATH = path.join(__dirname, '../../dataStore.json');

export interface DatabaseState {
  users: UserProfile[];
  passwords: Record<string, string>; // uid -> bcrypt hash
  vendors: Vendor[];
  products: Product[];
  carts: Record<string, Cart>; // consumerId -> Cart
  orders: Order[];
  conversations: Conversation[];
  messages: Message[];
  supportTickets: SupportTicket[];
  faqs?: SupportFAQ[];
  kbArticles?: KnowledgeBaseArticle[];
  aiConfigs: Record<string, AIAgentConfig>; // vendorId -> AIAgentConfig
  payments: PaymentTransaction[];
}

class DataStoreService {
  private state: DatabaseState = {
    users: [],
    passwords: {},
    vendors: [],
    products: [],
    carts: {},
    orders: [],
    conversations: [],
    messages: [],
    supportTickets: [],
    faqs: [],
    kbArticles: [],
    aiConfigs: {},
    payments: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    if (fs.existsSync(DATA_FILE_PATH)) {
      try {
        const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
        this.state = JSON.parse(raw);
        console.log('[DataStore] Loaded existing database from disk');
        if (this.ensureSeedUpgrades()) {
          this.persist();
        }
        firebaseService.syncInitialSeed({
          users: this.state.users,
          vendors: this.state.vendors,
          products: this.state.products,
          conversations: this.state.conversations,
          supportTickets: this.state.supportTickets,
          orders: this.state.orders,
          faqs: this.state.faqs,
          articles: this.state.kbArticles,
        });
        return;
      } catch (err) {
        console.warn('[DataStore] Could not parse existing data file, initializing fresh seed:', err);
      }
    }
    this.seedInitialData();
    this.ensureSeedUpgrades();
    this.persist();
    firebaseService.syncInitialSeed({
      users: this.state.users,
      vendors: this.state.vendors,
      products: this.state.products,
      conversations: this.state.conversations,
      supportTickets: this.state.supportTickets,
      orders: this.state.orders,
      faqs: this.state.faqs,
      articles: this.state.kbArticles,
    });
  }

  private ensureSeedUpgrades(): boolean {
    let changed = false;

    // Clean up any legacy third-vendor identifiers so only ConvoCart / NexaDigital branding remains
    const sanitizeText = (text: string): string =>
      text
        .replace(/craftora@convocart\.com/gi, 'studio@convocart.com')
        .replace(/vendor_craftora/gi, 'vendor_nexa_studio')
        .replace(/prod_craftora_/gi, 'prod_nexa_')
        .replace(/Craftor[āa]\s*Digital\s*&\s*Commerce\s*Studio/gi, 'NexaDigital Commerce & AI Studio')
        .replace(/Craftor[āa]\s*Studio/gi, 'NexaDigital Studio')
        .replace(/Craftor[āa]\s*Atelier/gi, 'NexaDigital Atelier')
        .replace(/Craftor[āa]\s*Acoustics/gi, 'NexaDigital Acoustics')
        .replace(/Craftor[āa]\s*OmniDesk/gi, 'NexaDesk')
        .replace(/Craftor[āa]\s*Lumière/gi, 'NexaLumière')
        .replace(/Craftor[āa]\s*Creator/gi, 'NexaCreator')
        .replace(/Craftor[āa]/gi, 'ConvoCart');

    const rawSerialized = JSON.stringify(this.state);
    if (/craftora|craftor[āa]/i.test(rawSerialized)) {
      this.state = JSON.parse(sanitizeText(rawSerialized));
      if (this.state.aiConfigs && this.state.aiConfigs['vendor_craftora']) {
        this.state.aiConfigs['vendor_nexa_studio'] = this.state.aiConfigs['vendor_craftora'];
        delete this.state.aiConfigs['vendor_craftora'];
      }
      changed = true;
    }

    // Ensure second multilingual support agent exists for the Human Agent Dispatch Center
    if (!this.state.users.find((u) => u.uid === 'user_support_2')) {
      const salt = bcrypt.genSaltSync(10);
      const defaultHash = this.state.passwords['user_support_1'] || bcrypt.hashSync('Password123!', salt);
      this.state.users.push({
        uid: 'user_support_2',
        email: 'kenji@convocart.com',
        displayName: 'Kenji Takahashi',
        role: 'support_agent',
        preferredLanguage: 'ja',
        photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
        phoneNumber: '+81-3-5555-0192',
        createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      });
      this.state.passwords['user_support_2'] = defaultHash;
      changed = true;
    }

    // Purge any legacy static seeded products, demo orders, demo conversations, and demo tickets
    const STATIC_PRODUCT_IDS = new Set([
      'prod_nexconn_pro_anc',
      'prod_tokyo_mech_keyboard',
      'prod_smartwatch_ultra',
      'prod_espresso_machine_pro',
      'prod_merino_wool_jacket',
      'prod_skincare_elixir',
      'prod_nexa_omnidesk',
      'prod_nexa_lumiere',
      'prod_nexa_sonic_kit',
    ]);
    const STATIC_ORDER_IDS = new Set(['ord_sample_9841']);
    const STATIC_CONV_IDS = new Set(['conv_consumer_vendor_audio', 'conv_consumer_vendor_ubuy']);
    const STATIC_MSG_IDS = new Set(['msg_1', 'msg_2', 'msg_3', 'msg_4', 'msg_intl_1', 'msg_intl_2']);
    const STATIC_TICKET_IDS = new Set(['tkt_1001', 'tkt_1002']);

    const prodBefore = this.state.products.length;
    this.state.products = this.state.products.filter((p) => !STATIC_PRODUCT_IDS.has(p.productId));
    if (this.state.products.length !== prodBefore) {
      changed = true;
      firebaseService.deleteDocsBatch('convocart_products', Array.from(STATIC_PRODUCT_IDS));
    }

    const ordBefore = this.state.orders.length;
    this.state.orders = this.state.orders.filter((o) => !STATIC_ORDER_IDS.has(o.orderId));
    if (this.state.orders.length !== ordBefore) {
      changed = true;
      firebaseService.deleteDocsBatch('convocart_orders', Array.from(STATIC_ORDER_IDS));
    }

    const convBefore = this.state.conversations.length;
    this.state.conversations = this.state.conversations.filter((c) => !STATIC_CONV_IDS.has(c.conversationId));
    if (this.state.conversations.length !== convBefore) {
      changed = true;
      firebaseService.deleteDocsBatch('convocart_conversations', Array.from(STATIC_CONV_IDS));
    }

    const msgBeforePurge = this.state.messages.length;
    this.state.messages = this.state.messages.filter(
      (m) => !STATIC_MSG_IDS.has(m.id) && !STATIC_CONV_IDS.has(m.conversationId)
    );
    if (this.state.messages.length !== msgBeforePurge) {
      changed = true;
    }

    const tktBefore = this.state.supportTickets.length;
    this.state.supportTickets = this.state.supportTickets.filter((t) => !STATIC_TICKET_IDS.has(t.ticketId));
    if (this.state.supportTickets.length !== tktBefore) {
      changed = true;
      firebaseService.deleteDocsBatch('support-tickets', Array.from(STATIC_TICKET_IDS));
    }

    // Seed Support FAQs if empty
    if (!this.state.faqs || this.state.faqs.length === 0) {
      this.state.faqs = [
        {
          id: 'faq_1',
          question: 'How does Multi-Language Translated Chat work between Buyers, Sellers, and Support Agents?',
          answer:
            'Every message sent in 1-on-1 or Support Dispatch chat is automatically detected and translated into each participant’s preferred language (English, Hindi, Japanese, Spanish, French, German, Chinese, Arabic) via Nexconn TranslateModule & our backend translation engine.',
          category: 'Translated Chat',
          helpful: 148,
          notHelpful: 3,
        },
        {
          id: 'faq_2',
          question: 'What are the SLA response times in the Human Agent Dispatch Center?',
          answer:
            'Urgent escalations target ~2–4 hours (with live instant dispatch), High priority ~8–12 hours, Medium ~24 hours, and Low ~48 hours. Live escalated chats appear immediately in the Support Dispatch Center.',
          category: 'Dispatch & SLA',
          helpful: 121,
          notHelpful: 2,
        },
        {
          id: 'faq_3',
          question: 'Are voice notes, webcam captures, and chat files saved safely?',
          answer:
            'Yes! Voice recordings, live webcam captures, and order inspection files are encrypted and persisted in secure ConvoCart cloud storage.',
          category: 'Security & Storage',
          helpful: 96,
          notHelpful: 1,
        },
        {
          id: 'faq_4',
          question: 'Can I make live Voice or Video Calls with verified sellers and support specialists?',
          answer:
            'Yes. Click the Phone or Video button inside any 1-on-1 conversation to launch a live call session with microphone & camera controls directly with the seller or dispatch specialist.',
          category: 'Voice & Video Calls',
          helpful: 89,
          notHelpful: 4,
        },
        {
          id: 'faq_5',
          question: 'Can I edit or recall a message after sending it in chat?',
          answer:
            'Yes! Hover over any message you sent to Edit the text (auto-retranslated) or Recall/Delete it immediately for everyone in the conversation.',
          category: 'Chat Controls',
          helpful: 74,
          notHelpful: 2,
        },
        {
          id: 'faq_6',
          question: 'How does product-based seller support work?',
          answer:
            'Select any seller-uploaded product in the Support Hub or on its product page to contact that exact seller in real time or open a product-linked support ticket.',
          category: 'Product Support',
          helpful: 112,
          notHelpful: 5,
        },
      ];
      changed = true;
    }

    // Seed Knowledge Base Articles
    if (!this.state.kbArticles || this.state.kbArticles.length === 0) {
      this.state.kbArticles = [
        {
          id: 'kb_1',
          title: 'Getting Started: Product-Based 1-on-1 Buyer–Seller Chat & Live Dispatch',
          summary:
            'Learn how ConvoCart connects buyers, sellers, and multilingual support agents in real time for every product.',
          content:
            '1. Open any seller-uploaded product and click "Message Seller" or choose the product in the Support Hub to launch a 1-on-1 encrypted conversation with that seller.\n2. Choose your preferred language from the composer globe menu (EN, HI, JA, ES, FR, DE, ZH, AR).\n3. Real-time messaging keeps buyer and seller synchronized across devices.\n4. Need a human specialist? Click "Escalate to Human" — a product-linked ticket is dispatched directly in the Support Dispatch Center.',
          category: 'Getting Started',
          tags: ['Product Chat', 'Translation', 'Dispatch'],
          readTime: '3 min read',
          views: 1240,
          author: 'ConvoCart Support Team',
          updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
        {
          id: 'kb_2',
          title: 'Using Voice Notes, Live Webcam Proof & Video Walkthroughs',
          summary:
            'Share crystal-clear voice notes, snap live webcam unboxing/defect photos, or start a live video inspection call.',
          content:
            '• Click the Microphone icon in chat to record a real-time voice message with a live frequency waveform.\n• Click the Camera icon to capture a photo directly from your webcam for instant fit or serial-number verification.\n• Click Phone or Video Call in the chat header to initiate a live call with the seller.',
          category: 'Media & Calls',
          tags: ['Voice Notes', 'WebRTC', 'Media Sync'],
          readTime: '4 min read',
          views: 892,
          author: 'ConvoCart Engineering',
          updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        },
        {
          id: 'kb_3',
          title: 'Understanding ConvoCart SLA Priorities & Refund Protection',
          summary:
            'Clear response guarantees (Urgent ~2–4h, High ~8–12h, Medium ~24h, Low ~48h) and buyer escrow policies.',
          content:
            'Every product-linked ticket is stamped with an SLA deadline and synchronized in real time. Approved refunds are processed automatically once resolved in the Support Dispatch Center.',
          category: 'Policies & SLA',
          tags: ['SLA', 'Refunds', 'Protection'],
          readTime: '2 min read',
          views: 675,
          author: 'Trust & Safety',
          updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
        },
        {
          id: 'kb_4',
          title: 'Multi-Vendor Seller Guide: Managing Global Chats in Japanese, Hindi & Spanish',
          summary:
            'How verified sellers configure their AI concierge, response availability, and bilingual dispatch handoffs.',
          content:
            'Vendors can set their store preferred language in Store Profile & AI Agent Studio, review live revenue telemetry charts, and claim or transfer chats seamlessly with ConvoCart Dispatch specialists.',
          category: 'Seller Guide',
          tags: ['Vendors', 'AI Concierge', 'Multi-Language'],
          readTime: '5 min read',
          views: 534,
          author: 'Partner Success',
          updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        },
      ];
      changed = true;
    }

    // Ensure existing FAQs and KB articles never expose underlying database/tech brand names
    for (const f of this.state.faqs || []) {
      if (/firebase|firestore|society-adc76/i.test(f.answer) || /firebase|firestore/i.test(f.category)) {
        f.answer = f.answer
          .replace(/Firebase Storage\s*\(society-adc76\)/gi, 'ConvoCart Encrypted Cloud Storage')
          .replace(/Cloud Firestore/gi, 'ConvoCart Cloud Sync')
          .replace(/Firebase|Firestore/gi, 'Cloud Sync');
        f.category = f.category.replace(/Firebase\s*&\s*/gi, '');
        changed = true;
      }
    }
    for (const a of this.state.kbArticles || []) {
      if (/firebase|firestore|society-adc76/i.test(`${a.summary} ${a.content} ${a.tags.join(',')}`)) {
        a.summary = a.summary.replace(/Firebase|Firestore/gi, 'Cloud Sync');
        a.content = a.content
          .replace(/Firebase Storage/gi, 'Encrypted Cloud Storage')
          .replace(/Firestore\s*\(support-tickets\)/gi, 'ConvoCart Cloud Sync')
          .replace(/Cloud Firestore\s*\(society-adc76\)/gi, 'ConvoCart Cloud Sync')
          .replace(/Firebase|Firestore/gi, 'Cloud Sync');
        a.tags = a.tags.map((t) => t.replace(/Firebase Storage/gi, 'Cloud Media'));
        changed = true;
      }
    }

    // Clean up any leftover ephemeral unit-test messages
    const beforeMsgCount = this.state.messages.length;
    this.state.messages = this.state.messages.filter((m) => m.conversationId !== 'conv_test_ephemeral');
    if (this.state.messages.length !== beforeMsgCount) {
      changed = true;
    }

    // Ensure every escalated conversation has an assigned Human Support Specialist so buyers are never left unanswered
    const supportAgents = this.state.users.filter((u) => u.role === 'support_agent');
    if (supportAgents.length > 0) {
      for (const conv of this.state.conversations) {
        if ((conv.status === 'escalated' || conv.escalatedToSupport) && !conv.assignedSupportAgentId) {
          const lang = conv.consumerPreferredLanguage || conv.vendorPreferredLanguage || 'en';
          const matchedAgent =
            supportAgents.find((a) => a.preferredLanguage === lang) ||
            supportAgents.find((a) => a.uid === 'user_support_1') ||
            supportAgents[0];
          if (matchedAgent) {
            conv.assignedSupportAgentId = matchedAgent.uid;
            conv.assignedSupportAgentName = matchedAgent.displayName;
            conv.supportAgentId = matchedAgent.uid;
            conv.dispatchedAt = conv.dispatchedAt || new Date().toISOString();
            const linkedTicket = this.state.supportTickets.find(
              (t) => t.conversationId === conv.conversationId && t.status !== 'closed'
            );
            if (linkedTicket && !linkedTicket.assignedAgentId) {
              linkedTicket.assignedAgentId = matchedAgent.uid;
              linkedTicket.assignedAgentName = matchedAgent.displayName;
              linkedTicket.status = 'in_progress';
            }
            changed = true;
          }
        }
      }
    }

    return changed;
  }

  public persist() {
    try {
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DataStore] Error persisting to disk:', err);
    }
  }

  private seedInitialData() {
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync('Password123!', salt);

    // 1. Users
    const consumerUser: UserProfile = {
      uid: 'user_consumer_1',
      email: 'customer@convocart.com',
      displayName: 'Alex Johnson',
      role: 'consumer',
      preferredLanguage: 'en',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      phoneNumber: '+1-555-0199',
      addresses: [
        {
          id: 'addr_1',
          fullName: 'Alex Johnson',
          phone: '+1-555-0199',
          street: '742 Evergreen Terrace',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94103',
          country: 'United States',
          isDefault: true,
        },
      ],
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const vendorUser: UserProfile = {
      uid: 'user_vendor_1',
      email: 'vendor@convocart.com',
      displayName: 'Elena Rostova',
      role: 'vendor',
      preferredLanguage: 'en',
      vendorId: 'vendor_nexconn_audio',
      photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
      phoneNumber: '+1-555-0182',
      createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const vendorUser2: UserProfile = {
      uid: 'user_vendor_2',
      email: 'global@convocart.com',
      displayName: 'Marcus Vance',
      role: 'vendor',
      preferredLanguage: 'en',
      vendorId: 'vendor_ubuy_express',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      phoneNumber: '+1-555-0144',
      createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const supportUser: UserProfile = {
      uid: 'user_support_1',
      email: 'support@convocart.com',
      displayName: 'Sarah Connor',
      role: 'support_agent',
      preferredLanguage: 'en',
      photoURL: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
      phoneNumber: '+1-555-0111',
      createdAt: new Date(Date.now() - 50 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const adminUser: UserProfile = {
      uid: 'user_admin_1',
      email: 'admin@convocart.com',
      displayName: 'Chief Administrator',
      role: 'admin',
      preferredLanguage: 'en',
      photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      phoneNumber: '+1-555-0100',
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.users = [consumerUser, vendorUser, vendorUser2, supportUser, adminUser];
    this.state.passwords = {
      user_consumer_1: defaultPasswordHash,
      user_vendor_1: defaultPasswordHash,
      user_vendor_2: defaultPasswordHash,
      user_support_1: defaultPasswordHash,
      user_admin_1: defaultPasswordHash,
    };

    // 2. Vendors
    const vendor1: Vendor = {
      vendorId: 'vendor_nexconn_audio',
      ownerUid: 'user_vendor_1',
      businessName: 'Nexconn Audio & Smart Tech',
      description: 'Official flagship store for premium studio acoustics, wireless noise-canceling headsets, and AI-enhanced wearable audio gear.',
      logo: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&auto=format&fit=crop&q=80',
      category: 'Electronics & Gadgets',
      verificationStatus: 'approved',
      rating: 4.9,
      reviewCount: 342,
      businessPolicies: {
        shipping: 'Free express shipping on all domestic orders over $150. Shipped within 24 hours.',
        returns: '30-day hassle-free money back guarantee. Free return shipping labels provided.',
        warranty: '2-year comprehensive international manufacturer warranty covering all internal drivers and electronics.',
      },
      availability: 'online',
      aiAgentEnabled: true,
      commissionRate: 0.05,
      contactEmail: 'support@nexconnaudio.com',
      contactPhone: '+1-800-555-NEXC',
      createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const vendor2: Vendor = {
      vendorId: 'vendor_ubuy_express',
      ownerUid: 'user_vendor_2',
      businessName: 'Ubuy Global Express Marketplace',
      description: 'Direct global importer delivering rare high-end artisan electronics, Tokyo gaming keyboards, and Swiss designer accessories directly to your doorstep.',
      logo: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
      category: 'Ubuy Global Express',
      verificationStatus: 'approved',
      rating: 4.8,
      reviewCount: 219,
      businessPolicies: {
        shipping: 'DHL Express international worldwide delivery with pre-cleared customs and real-time flight tracking.',
        returns: '14-day international returns with regional return hub drop-offs.',
        warranty: '1-year global authentic warranty with localized inspection support.',
      },
      availability: 'away',
      aiAgentEnabled: true,
      commissionRate: 0.07,
      contactEmail: 'concierge@ubuyglobal.com',
      contactPhone: '+1-888-UBUY-EXP',
      createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.vendors = [vendor1, vendor2];

    // 3. Products — strictly dynamic seller-uploaded products only (no static seed catalog)
    this.state.products = [];

    // 4. AIAgentConfig for Vendors
    this.state.aiConfigs['vendor_nexconn_audio'] = {
      vendorId: 'vendor_nexconn_audio',
      enabled: true,
      agentName: 'Aria (Nexconn Audio Assistant)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      greetingMessage: 'Hello! I am Aria, the AI assistant for Nexconn Audio. How can I help you choose headphones, check specifications, or track orders today?',
      personality: 'friendly',
      supportedLanguages: ['en', 'es', 'fr', 'hi'],
      businessHours: {
        enabled: true,
        start: '09:00',
        end: '18:00',
        timezone: 'UTC',
      },
      responseStyle: 'friendly',
      faqs: [
        {
          question: 'Do the headphones support multi-device pairing?',
          answer: 'Yes! The Nexconn SonicPro ANC supports Bluetooth 5.4 multi-point pairing, allowing you to connect seamlessly to your laptop and smartphone simultaneously.',
        },
        {
          question: 'What is the return policy if I don’t like the fit?',
          answer: 'We offer a 30-day money-back guarantee with full refunds and free prepaid return shipping labels.',
        },
        {
          question: 'Are replacements ear cushions available?',
          answer: 'Yes, magnetic memory-foam replacement ear cushions can be ordered directly through our store or by messaging our support.',
        },
      ],
      shippingPolicy: 'Free express domestic shipping on all orders over $150. Delivery takes 2-3 business days.',
      returnPolicy: '30-day hassle-free return window with zero restocking fees.',
      warrantyInfo: '2-year comprehensive international warranty covering hardware defects.',
      escalationRules: ['refund request', 'damaged package', 'speak to human', 'urgent complaint'],
      humanTakeoverActive: false,
      updatedAt: new Date().toISOString(),
    };

    this.state.aiConfigs['vendor_ubuy_express'] = {
      vendorId: 'vendor_ubuy_express',
      enabled: true,
      agentName: 'Kai (Ubuy Global Concierge)',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      greetingMessage: 'Greetings! I am Kai from Ubuy Global Express. Looking for international artisan gear, shipping timeframes, or import assistance?',
      personality: 'professional',
      supportedLanguages: ['en', 'ja', 'de', 'fr'],
      businessHours: {
        enabled: true,
        start: '08:00',
        end: '20:00',
        timezone: 'UTC',
      },
      responseStyle: 'detailed',
      faqs: [
        {
          question: 'Are customs and import taxes included?',
          answer: 'All customs duties, tariffs, and taxes are pre-calculated and cleared through our DHL Express pipeline. You will never face surprise import fees upon delivery.',
        },
        {
          question: 'How long does shipping from Tokyo or Italy take?',
          answer: 'International air express shipments arrive in 3 to 5 business days with full door-to-door tracking.',
        },
      ],
      shippingPolicy: 'Express door-to-door DHL delivery with pre-cleared customs.',
      returnPolicy: '14-day international returns processed through domestic partner return hubs.',
      warrantyInfo: '1-year global authentic item guarantee.',
      escalationRules: ['customs delay', 'damaged in transit', 'talk to vendor'],
      humanTakeoverActive: false,
      updatedAt: new Date().toISOString(),
    };

    // 5. Initial Orders, Conversations, Messages & Support Tickets (strictly dynamic per seller/buyer actions)
    this.state.orders = [];
    this.state.conversations = [];
    this.state.messages = [];
    this.state.supportTickets = [];

    console.log('[DataStore] Initialized dynamic zero-static database');
  }

  // Getters & Query helpers
  public getUsers(): UserProfile[] {
    return this.state.users;
  }

  public findUserById(uid: string): UserProfile | undefined {
    return this.state.users.find((u) => u.uid === uid || u.firebaseUid === uid);
  }

  public findUserByFirebaseUid(firebaseUid: string): UserProfile | undefined {
    return this.state.users.find((u) => u.firebaseUid === firebaseUid || u.uid === firebaseUid);
  }

  public findUserByEmail(email: string): UserProfile | undefined {
    const normalized = email.trim().toLowerCase();
    const emailAliases: Record<string, string> = {
      'consumer@convocart.com': 'customer@convocart.com',
      'vendor@nexconnaudio.com': 'vendor@convocart.com',
      'vendor@ubuyglobal.com': 'global@convocart.com',
    };
    const lookupEmail = emailAliases[normalized] || normalized;
    return this.state.users.find(
      (u) => u.email.toLowerCase() === normalized || u.email.toLowerCase() === lookupEmail
    );
  }

  public getPasswordHash(uid: string): string | undefined {
    return this.state.passwords[uid];
  }

  public addUser(user: UserProfile, passwordHash: string): void {
    this.state.users.push(user);
    this.state.passwords[user.uid] = passwordHash;
    this.persist();
    void firebaseService.syncDoc('convocart_users', user.uid, user);
  }

  public updateUser(uid: string, updates: Partial<UserProfile>): UserProfile | undefined {
    const idx = this.state.users.findIndex((u) => u.uid === uid || u.firebaseUid === uid);
    if (idx === -1) return undefined;
    const prev = this.state.users[idx];
    const updatedUser: UserProfile = {
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.state.users[idx] = updatedUser;

    const targetUid = updatedUser.uid;
    const nowIso = new Date().toISOString();

    // Propagate updated customer details across active conversations, orders, and support tickets
    for (let i = 0; i < this.state.conversations.length; i++) {
      const c = this.state.conversations[i];
      if (c.consumerId === targetUid) {
        this.state.conversations[i] = {
          ...c,
          consumerName: updatedUser.displayName,
          consumerAvatar: updatedUser.photoURL || c.consumerAvatar,
          consumerPreferredLanguage: updatedUser.preferredLanguage || c.consumerPreferredLanguage,
          consumerEmail: updatedUser.email,
          consumerPhone: updatedUser.phoneNumber || c.consumerPhone,
          updatedAt: nowIso,
        };
        void firebaseService.syncDoc('convocart_conversations', c.conversationId, this.state.conversations[i]);
      }
    }

    for (let i = 0; i < this.state.orders.length; i++) {
      const o = this.state.orders[i];
      if (o.consumerId === targetUid) {
        this.state.orders[i] = {
          ...o,
          consumerName: updatedUser.displayName,
          consumerEmail: updatedUser.email,
          consumerPhone: updatedUser.phoneNumber || o.consumerPhone,
        };
      }
    }

    for (let i = 0; i < this.state.supportTickets.length; i++) {
      const t = this.state.supportTickets[i];
      if (t.consumerId === targetUid) {
        this.state.supportTickets[i] = {
          ...t,
          consumerName: updatedUser.displayName,
          consumerEmail: updatedUser.email,
        };
      }
    }

    this.persist();
    void firebaseService.syncDoc('convocart_users', updatedUser.uid, updatedUser);
    return updatedUser;
  }

  public deleteUser(uid: string): boolean {
    const before = this.state.users.length;
    this.state.users = this.state.users.filter((u) => u.uid !== uid);
    delete this.state.passwords[uid];
    if (this.state.users.length === before) return false;
    this.persist();
    void firebaseService.deleteDocFromCloud('convocart_users', uid);
    return true;
  }

  public getVendors(): Vendor[] {
    return this.state.vendors;
  }

  public findVendorById(vendorId: string): Vendor | undefined {
    return this.state.vendors.find((v) => v.vendorId === vendorId);
  }

  public findVendorByOwnerUid(ownerUid: string): Vendor | undefined {
    return this.state.vendors.find((v) => v.ownerUid === ownerUid);
  }

  public addVendor(vendor: Vendor): void {
    this.state.vendors.push(vendor);
    this.persist();
    void firebaseService.syncDoc('convocart_vendors', vendor.vendorId, vendor);
  }

  public updateVendor(vendorId: string, updates: Partial<Vendor>): Vendor | undefined {
    const idx = this.state.vendors.findIndex((v) => v.vendorId === vendorId);
    if (idx === -1) return undefined;
    this.state.vendors[idx] = { ...this.state.vendors[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    void firebaseService.syncDoc('convocart_vendors', vendorId, this.state.vendors[idx]);
    return this.state.vendors[idx];
  }

  public getProducts(filters?: {
    categoryId?: string;
    vendorId?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    status?: string;
    sort?: string;
  }): Product[] {
    let list = this.state.products.slice();

    if (filters?.status) {
      list = list.filter((p) => p.status === filters.status);
    } else {
      list = list.filter((p) => p.status === 'active');
    }

    if (filters?.vendorId) {
      list = list.filter((p) => p.vendorId === filters.vendorId);
    }

    if (filters?.categoryId) {
      list = list.filter((p) => p.categoryId === filters.categoryId);
    }

    if (filters?.brand) {
      list = list.filter((p) => p.brand.toLowerCase() === filters.brand?.toLowerCase());
    }

    if (filters?.minPrice !== undefined) {
      list = list.filter((p) => p.price >= filters.minPrice!);
    }

    if (filters?.maxPrice !== undefined) {
      list = list.filter((p) => p.price <= filters.maxPrice!);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    if (filters?.sort) {
      if (filters.sort === 'price_asc') {
        list.sort((a, b) => a.price - b.price);
      } else if (filters.sort === 'price_desc') {
        list.sort((a, b) => b.price - a.price);
      } else if (filters.sort === 'rating') {
        list.sort((a, b) => b.rating - a.rating);
      } else if (filters.sort === 'newest') {
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    }

    return list;
  }

  public findProductById(productId: string): Product | undefined {
    return this.state.products.find((p) => p.productId === productId);
  }

  public addProduct(product: Product): void {
    this.state.products.push(product);
    this.persist();
    void firebaseService.syncDoc('convocart_products', product.productId, product);
  }

  public updateProduct(productId: string, updates: Partial<Product>): Product | undefined {
    const idx = this.state.products.findIndex((p) => p.productId === productId);
    if (idx === -1) return undefined;
    this.state.products[idx] = { ...this.state.products[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    void firebaseService.syncDoc('convocart_products', productId, this.state.products[idx]);
    return this.state.products[idx];
  }

  public deleteProduct(productId: string): boolean {
    const idx = this.state.products.findIndex((p) => p.productId === productId);
    if (idx === -1) return false;
    // Soft delete to archive
    this.state.products[idx].status = 'archived';
    this.state.products[idx].updatedAt = new Date().toISOString();
    this.persist();
    return true;
  }

  public getCart(consumerId: string): Cart {
    if (!this.state.carts[consumerId]) {
      this.state.carts[consumerId] = {
        cartId: `cart_${consumerId}`,
        consumerId,
        items: [],
        updatedAt: new Date().toISOString(),
      };
      this.persist();
    }
    return this.state.carts[consumerId];
  }

  public saveCart(cart: Cart): void {
    this.state.carts[cart.consumerId] = cart;
    this.persist();
  }

  public getOrders(filters?: { consumerId?: string; vendorId?: string; orderStatus?: string }): Order[] {
    let list = this.state.orders.slice();
    if (filters?.consumerId) {
      list = list.filter((o) => o.consumerId === filters.consumerId);
    }
    if (filters?.vendorId) {
      list = list.filter((o) => o.vendorId === filters.vendorId);
    }
    if (filters?.orderStatus) {
      list = list.filter((o) => o.orderStatus === filters.orderStatus);
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }

  public findOrderById(orderId: string): Order | undefined {
    return this.state.orders.find((o) => o.orderId === orderId);
  }

  public addOrder(order: Order): void {
    this.state.orders.push(order);
    this.persist();
    void firebaseService.syncDoc('convocart_orders', order.orderId, order);
  }

  public updateOrder(orderId: string, updates: Partial<Order>): Order | undefined {
    const idx = this.state.orders.findIndex((o) => o.orderId === orderId);
    if (idx === -1) return undefined;
    this.state.orders[idx] = { ...this.state.orders[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    void firebaseService.syncDoc('convocart_orders', orderId, this.state.orders[idx]);
    return this.state.orders[idx];
  }

  public getAllConversations(): Conversation[] {
    return this.state.conversations;
  }

  public getConversations(userId: string, role: string): Conversation[] {
    let list: Conversation[] = [];
    if (role === 'consumer') {
      list = this.state.conversations.filter((c) => c.consumerId === userId);
    } else if (role === 'vendor') {
      // Find vendorId for this user
      const vendor = this.findVendorByOwnerUid(userId);
      if (vendor) {
        list = this.state.conversations.filter((c) => c.vendorId === vendor.vendorId);
      }
    } else if (role === 'support_agent' || role === 'admin') {
      list = this.state.conversations;
    }
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list;
  }

  public findConversationById(conversationId: string): Conversation | undefined {
    return this.state.conversations.find((c) => c.conversationId === conversationId);
  }

  public addConversation(conv: Conversation): void {
    this.state.conversations.push(conv);
    this.persist();
    void firebaseService.syncDoc('convocart_conversations', conv.conversationId, conv);
  }

  public updateConversation(conversationId: string, updates: Partial<Conversation>): Conversation | undefined {
    const idx = this.state.conversations.findIndex((c) => c.conversationId === conversationId);
    if (idx === -1) return undefined;
    this.state.conversations[idx] = { ...this.state.conversations[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    void firebaseService.syncDoc('convocart_conversations', conversationId, this.state.conversations[idx]);
    return this.state.conversations[idx];
  }

  public getMessages(conversationId: string): Message[] {
    return this.state.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public findMessageById(conversationId: string, messageId: string): Message | undefined {
    return this.state.messages.find((m) => m.conversationId === conversationId && m.id === messageId);
  }

  public updateMessage(messageId: string, updates: Partial<Message>): Message | undefined {
    const idx = this.state.messages.findIndex((m) => m.id === messageId);
    if (idx === -1) return undefined;
    this.state.messages[idx] = {
      ...this.state.messages[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    void firebaseService.syncDoc('convocart_messages', messageId, this.state.messages[idx]);
    return this.state.messages[idx];
  }

  public deleteMessage(messageId: string): boolean {
    const before = this.state.messages.length;
    this.state.messages = this.state.messages.filter((m) => m.id !== messageId);
    if (this.state.messages.length === before) return false;
    this.persist();
    return true;
  }

  public deleteConversation(conversationId: string): boolean {
    const before = this.state.conversations.length;
    this.state.conversations = this.state.conversations.filter((c) => c.conversationId !== conversationId);
    this.state.messages = this.state.messages.filter((m) => m.conversationId !== conversationId);
    if (this.state.conversations.length === before) return false;
    this.persist();
    void firebaseService.deleteDocFromCloud('convocart_conversations', conversationId);
    return true;
  }

  public addMessage(message: Message): void {
    this.state.messages.push(message);
    // Update conversation lastMessage & unread count
    const conv = this.findConversationById(message.conversationId);
    if (conv) {
      const previewText = message.metadata?.rsaEncrypted
        ? '🔒 RSA-2048 Encrypted Message'
        : message.text;
      conv.lastMessage = {
        text: previewText,
        senderId: message.senderId,
        timestamp: message.createdAt,
        type: message.type,
      };
      conv.updatedAt = message.createdAt;
      // Increment unread count for the other party
      const recipientId = message.recipientId;
      conv.unreadCount[recipientId] = (conv.unreadCount[recipientId] || 0) + 1;
      void firebaseService.syncDoc('convocart_conversations', conv.conversationId, conv);
    }
    this.persist();
    void firebaseService.syncDoc('convocart_messages', message.id, message);
  }

  public getSupportTickets(filters?: { consumerId?: string; assignedAgentId?: string; status?: string }): SupportTicket[] {
    let list = this.state.supportTickets.slice();
    if (filters?.consumerId) {
      list = list.filter((t) => t.consumerId === filters.consumerId);
    }
    if (filters?.assignedAgentId) {
      list = list.filter((t) => t.assignedAgentId === filters.assignedAgentId);
    }
    if (filters?.status) {
      list = list.filter((t) => t.status === filters.status);
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }

  public findSupportTicketById(ticketId: string): SupportTicket | undefined {
    return this.state.supportTickets.find((t) => t.ticketId === ticketId);
  }

  public addSupportTicket(ticket: SupportTicket): void {
    this.state.supportTickets.push(ticket);
    this.persist();
    void firebaseService.syncDoc('support-tickets', ticket.ticketId, ticket);
  }

  public updateSupportTicket(ticketId: string, updates: Partial<SupportTicket>): SupportTicket | undefined {
    const idx = this.state.supportTickets.findIndex((t) => t.ticketId === ticketId);
    if (idx === -1) return undefined;
    this.state.supportTickets[idx] = { ...this.state.supportTickets[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    void firebaseService.syncDoc('support-tickets', ticketId, this.state.supportTickets[idx]);
    return this.state.supportTickets[idx];
  }

  public deleteSupportTicket(ticketId: string): boolean {
    const before = this.state.supportTickets.length;
    this.state.supportTickets = this.state.supportTickets.filter((t) => t.ticketId !== ticketId);
    if (this.state.supportTickets.length === before) return false;
    this.persist();
    void firebaseService.deleteDocFromCloud('support-tickets', ticketId);
    return true;
  }

  public addSupportTicketReply(ticketId: string, reply: SupportTicketReply): SupportTicket | undefined {
    const ticket = this.findSupportTicketById(ticketId);
    if (!ticket) return undefined;
    const replies = [...(ticket.replies || []), reply];
    const nextStatus =
      reply.isAdminOrAgent && ticket.status === 'open' ? 'in_progress' : ticket.status;
    return this.updateSupportTicket(ticketId, { replies, status: nextStatus });
  }

  public updateSupportTicketReply(
    ticketId: string,
    replyId: string,
    updates: Partial<SupportTicketReply>
  ): SupportTicket | undefined {
    const ticket = this.findSupportTicketById(ticketId);
    if (!ticket || !ticket.replies) return undefined;
    const replies = ticket.replies.map((r) => (r.id === replyId ? { ...r, ...updates } : r));
    return this.updateSupportTicket(ticketId, { replies });
  }

  public getFAQs(): SupportFAQ[] {
    return this.state.faqs || [];
  }

  public voteFAQ(faqId: string, type: 'helpful' | 'notHelpful'): SupportFAQ | undefined {
    if (!this.state.faqs) return undefined;
    const idx = this.state.faqs.findIndex((f) => f.id === faqId);
    if (idx === -1) return undefined;
    if (type === 'helpful') {
      this.state.faqs[idx].helpful += 1;
    } else {
      this.state.faqs[idx].notHelpful += 1;
    }
    this.persist();
    void firebaseService.syncDoc('convocart_faqs', faqId, this.state.faqs[idx]);
    return this.state.faqs[idx];
  }

  public addFAQ(faq: SupportFAQ): SupportFAQ {
    if (!this.state.faqs) this.state.faqs = [];
    this.state.faqs.unshift(faq);
    this.persist();
    void firebaseService.syncDoc('convocart_faqs', faq.id, faq);
    return faq;
  }

  public updateFAQ(faqId: string, updates: Partial<SupportFAQ>): SupportFAQ | undefined {
    if (!this.state.faqs) return undefined;
    const idx = this.state.faqs.findIndex((f) => f.id === faqId);
    if (idx === -1) return undefined;
    this.state.faqs[idx] = { ...this.state.faqs[idx], ...updates };
    this.persist();
    void firebaseService.syncDoc('convocart_faqs', faqId, this.state.faqs[idx]);
    return this.state.faqs[idx];
  }

  public deleteFAQ(faqId: string): boolean {
    if (!this.state.faqs) return false;
    const before = this.state.faqs.length;
    this.state.faqs = this.state.faqs.filter((f) => f.id !== faqId);
    if (this.state.faqs.length === before) return false;
    this.persist();
    void firebaseService.deleteDocFromCloud('convocart_faqs', faqId);
    return true;
  }

  public getKBArticles(): KnowledgeBaseArticle[] {
    return this.state.kbArticles || [];
  }

  public addKBArticle(article: KnowledgeBaseArticle): KnowledgeBaseArticle {
    if (!this.state.kbArticles) this.state.kbArticles = [];
    this.state.kbArticles.unshift(article);
    this.persist();
    void firebaseService.syncDoc('convocart_kb', article.id, article);
    return article;
  }

  public updateKBArticle(
    articleId: string,
    updates: Partial<KnowledgeBaseArticle>
  ): KnowledgeBaseArticle | undefined {
    if (!this.state.kbArticles) return undefined;
    const idx = this.state.kbArticles.findIndex((a) => a.id === articleId);
    if (idx === -1) return undefined;
    this.state.kbArticles[idx] = {
      ...this.state.kbArticles[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    void firebaseService.syncDoc('convocart_kb', articleId, this.state.kbArticles[idx]);
    return this.state.kbArticles[idx];
  }

  public deleteKBArticle(articleId: string): boolean {
    if (!this.state.kbArticles) return false;
    const before = this.state.kbArticles.length;
    this.state.kbArticles = this.state.kbArticles.filter((a) => a.id !== articleId);
    if (this.state.kbArticles.length === before) return false;
    this.persist();
    void firebaseService.deleteDocFromCloud('convocart_kb', articleId);
    return true;
  }

  public getAIAgentConfig(vendorId: string): AIAgentConfig | undefined {
    return this.state.aiConfigs[vendorId];
  }

  public setAIAgentConfig(vendorId: string, config: AIAgentConfig): void {
    this.state.aiConfigs[vendorId] = config;
    this.persist();
  }

  public addPayment(payment: PaymentTransaction): void {
    this.state.payments.push(payment);
    this.persist();
  }

  public findPaymentById(paymentId: string): PaymentTransaction | undefined {
    return this.state.payments.find((p) => p.paymentId === paymentId);
  }

  public findPaymentByOrderId(orderId: string): PaymentTransaction | undefined {
    return this.state.payments.find((p) => p.orderId === orderId);
  }

  public updatePayment(paymentId: string, updates: Partial<PaymentTransaction>): PaymentTransaction | undefined {
    const idx = this.state.payments.findIndex((p) => p.paymentId === paymentId);
    if (idx === -1) return undefined;
    this.state.payments[idx] = { ...this.state.payments[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.state.payments[idx];
  }
}

export const db = new DataStoreService();
