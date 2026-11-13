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
  AIAgentConfig,
  PaymentTransaction,
  DEFAULT_CATEGORIES,
} from '../../../shared';

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
        return;
      } catch (err) {
        console.warn('[DataStore] Could not parse existing data file, initializing fresh seed:', err);
      }
    }
    this.seedInitialData();
    this.persist();
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

    // 3. Products
    this.state.products = [
      {
        productId: 'prod_nexconn_pro_anc',
        vendorId: 'vendor_nexconn_audio',
        vendorName: 'Nexconn Audio & Smart Tech',
        title: 'Nexconn SonicPro ANC Studio Wireless Headphones',
        description: 'Engineered for audiophiles and producers. Features hybrid 45dB Active Noise Cancellation, custom 40mm titanium diaphragm drivers, 65-hour playback time, ultra-low latency gaming mode, and Bluetooth 5.4 multi-point connectivity.',
        categoryId: 'cat-electronics',
        categoryName: 'Electronics & Gadgets',
        brand: 'Nexconn Audio',
        sku: 'NEX-SPRO-01',
        price: 299,
        discount: 15,
        stock: 45,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { id: 'var_color', name: 'Color', options: ['Obsidian Black', 'Lunar Silver', 'Midnight Navy'] },
          { id: 'var_cable', name: 'Accessories', options: ['Standard Pack', 'Studio Pro Hard-Case Kit'], priceDiff: 25 },
        ],
        specifications: {
          'Driver Size': '40mm Titanium Dome',
          'Frequency Response': '10Hz – 40,000Hz (Hi-Res Audio Certified)',
          'Battery Life': '65 Hours (ANC Off) / 48 Hours (ANC On)',
          'Charging': 'USB-C Quick Charge (10 mins = 5 hours)',
          'Noise Cancellation': 'Dual-chip Adaptive ANC (-45dB)',
          'Microphones': '6 AI Beamforming Mics with Wind Shield',
        },
        shippingPolicy: 'Ships next business day via insured air parcel.',
        returnPolicy: '30-day money back guarantee with zero restocking fee.',
        status: 'active',
        rating: 4.9,
        reviewCount: 148,
        isFeatured: true,
        isTrending: true,
        createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        productId: 'prod_tokyo_mech_keyboard',
        vendorId: 'vendor_ubuy_express',
        vendorName: 'Ubuy Global Express Marketplace',
        title: 'Akiba Keebs Master Artisan 75% Mechanical Keyboard (Hot-Swap)',
        description: 'Direct Tokyo Import. CNC carved aerospace aluminum chassis with gasket mount structure, pre-lubed Gateron Oil King linear switches, PBT dye-sublimated cherry keycaps, and south-facing RGB per-key illumination.',
        categoryId: 'cat-global',
        categoryName: 'Ubuy Global Express',
        brand: 'Akiba Keebs',
        sku: 'AKB-75-JP',
        price: 249,
        discount: 10,
        stock: 18,
        images: [
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { id: 'var_switch', name: 'Switch Type', options: ['Oil King Linear', 'Baby Kangaroo Tactile'] },
        ],
        specifications: {
          'Layout': '75% Compact (82 Keys)',
          'Structure': 'Multi-layer Silicone Gasket Mounted',
          'Connectivity': 'Tri-mode (2.4GHz / Bluetooth 5.2 / USB-C)',
          'Polling Rate': '1000Hz (Wired & 2.4G)',
          'Weight': '1.75 kg (Solid Aluminum)',
        },
        shippingPolicy: 'Shipped from Haneda Hub via DHL Worldwide Express (3-5 days delivery).',
        returnPolicy: '14-day warranty with US/EU hub returns.',
        status: 'active',
        rating: 4.8,
        reviewCount: 76,
        isFeatured: true,
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        productId: 'prod_smartwatch_ultra',
        vendorId: 'vendor_nexconn_audio',
        vendorName: 'Nexconn Audio & Smart Tech',
        title: 'Nexconn PulseTrack GPS Sapphire Rugged Smartwatch',
        description: 'Ultra-tough titanium casing with sapphire crystal touch display. Dual-frequency precision GPS, continuous ECG and SpO2 health tracking, offline topological maps, 100m water resistance, and 14-day battery life.',
        categoryId: 'cat-electronics',
        categoryName: 'Electronics & Gadgets',
        brand: 'Nexconn Tech',
        sku: 'NEX-WATCH-U2',
        price: 399,
        discount: 20,
        stock: 32,
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
        ],
        specifications: {
          'Display': '1.43-inch AMOLED Sapphire Display (1000 nits)',
          'Battery': '500mAh (Up to 14 days normal usage)',
          'Water Rating': '10 ATM (100 meters dive proof)',
          'Sensors': 'Optical Heart Rate, SpO2, Skin Temp, Barometric Altimeter, Compass',
        },
        shippingPolicy: 'Free express shipping worldwide.',
        returnPolicy: '30-day return policy.',
        status: 'active',
        rating: 4.7,
        reviewCount: 89,
        isFeatured: false,
        isTrending: true,
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        productId: 'prod_espresso_machine_pro',
        vendorId: 'vendor_ubuy_express',
        vendorName: 'Ubuy Global Express Marketplace',
        title: 'Milano Barista Craft Dual-Boiler Espresso Machine',
        description: 'Direct Italian Import. Commercial grade 58mm portafilter, PID dual temperature control, commercial rotary vane pump, and cool-touch micro-foam steam wand for third-wave latte art at home.',
        categoryId: 'cat-home',
        categoryName: 'Home & Kitchen',
        brand: 'Milano Craft',
        sku: 'MIL-ESP-580',
        price: 899,
        discount: 12,
        stock: 12,
        images: [
          'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
        ],
        specifications: {
          'Boiler Type': 'Dual Stainless Steel Boilers (Brew: 0.8L, Steam: 1.5L)',
          'Pressure': '15 Bar Commercial Italian Rotary Pump',
          'Portafilter': 'Commercial 58mm Solid Brass Chrome-plated',
          'Power': '1800W Rapid Heat-Up',
        },
        shippingPolicy: 'Crated heavy cargo with white-glove curbside delivery.',
        returnPolicy: '30-day satisfaction guarantee.',
        status: 'active',
        rating: 4.95,
        reviewCount: 54,
        isFeatured: true,
        isTrending: false,
        createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        productId: 'prod_merino_wool_jacket',
        vendorId: 'vendor_ubuy_express',
        vendorName: 'Ubuy Global Express Marketplace',
        title: 'Nordic Explorer Merino Insulated Technical Parka',
        description: 'Tailored Scandinavian design combining 100% fine Merino wool thermal insulation with a breathable 20,000mm waterproof storm shell. Magnet-snap pockets and internal storm cuffs.',
        categoryId: 'cat-fashion',
        categoryName: 'Fashion & Apparel',
        brand: 'Nordic Heritage',
        sku: 'NOR-PARKA-09',
        price: 349,
        discount: 0,
        stock: 25,
        images: [
          'https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { id: 'var_size', name: 'Size', options: ['S', 'M', 'L', 'XL'] },
          { id: 'var_color', name: 'Color', options: ['Deep Forest Green', 'Charcoal Heather'] },
        ],
        specifications: {
          'Shell Material': '3-Layer Recycled Ripstop Nylon (20k Waterproof)',
          'Insulation': '250gsm Virgin Merino Wool Blend',
          'Zippers': 'YKK Aquaguard Matte Waterproof Zippers',
        },
        shippingPolicy: 'Free standard shipping.',
        returnPolicy: '30-day exchange for sizing differences.',
        status: 'active',
        rating: 4.6,
        reviewCount: 42,
        isFeatured: false,
        isTrending: true,
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        productId: 'prod_skincare_elixir',
        vendorId: 'vendor_nexconn_audio',
        vendorName: 'Nexconn Audio & Smart Tech',
        title: 'Lumiere Botanical Bio-Retinol Night Recovery Elixir',
        description: 'Clinically proven 1% plant-derived bakuchiol infused with squalane, cold-pressed rosehip seed oil, and tri-peptide complex to deeply restore cellular elasticity overnight.',
        categoryId: 'cat-beauty',
        categoryName: 'Beauty & Personal Care',
        brand: 'Lumiere Organics',
        sku: 'LUM-BIO-30',
        price: 78,
        discount: 25,
        stock: 80,
        images: [
          'https://images.unsplash.com/photo-1608248597359-2169b22a0d92?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
        ],
        specifications: {
          'Volume': '30ml / 1.0 fl oz Dropper Bottle',
          'Skin Type': 'Sensitive, Dry, Mature, Combination',
          'Key Ingredients': '1% Bakuchiol, Olive Squalane, Peptides, Blue Tansy',
        },
        shippingPolicy: 'Ships in temperature-controlled protective wrapping.',
        returnPolicy: '14-day unopened guarantee.',
        status: 'active',
        rating: 4.88,
        reviewCount: 110,
        isFeatured: false,
        isTrending: true,
        createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

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

    // 5. Initial Orders
    const initialOrder: Order = {
      orderId: 'ord_sample_9841',
      checkoutGroupId: 'chk_group_101',
      consumerId: 'user_consumer_1',
      consumerName: 'Alex Johnson',
      consumerEmail: 'customer@convocart.com',
      vendorId: 'vendor_nexconn_audio',
      vendorName: 'Nexconn Audio & Smart Tech',
      items: [
        {
          productId: 'prod_nexconn_pro_anc',
          vendorId: 'vendor_nexconn_audio',
          title: 'Nexconn SonicPro ANC Studio Wireless Headphones',
          price: 254.15,
          discount: 15,
          quantity: 1,
          selectedVariant: { Color: 'Obsidian Black', Accessories: 'Standard Pack' },
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        },
      ],
      subtotal: 254.15,
      shipping: 0,
      discount: 0,
      tax: 20.33,
      total: 274.48,
      paymentStatus: 'captured',
      orderStatus: 'shipped',
      shippingStatus: 'In Transit — Estimated delivery tomorrow by 4 PM',
      trackingNumber: 'TRK-NEX-889921',
      shippingCarrier: 'FedEx Priority',
      addressSnapshot: consumerUser.addresses![0],
      paymentMethod: 'razorpay',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    };

    this.state.orders = [initialOrder];

    // 6. Initial Conversations & Messages
    const convId = 'conv_consumer_vendor_audio';
    const initialConversation: Conversation = {
      conversationId: convId,
      consumerId: 'user_consumer_1',
      consumerName: 'Alex Johnson',
      consumerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      vendorId: 'vendor_nexconn_audio',
      vendorBusinessName: 'Nexconn Audio & Smart Tech',
      productId: 'prod_nexconn_pro_anc',
      productTitle: 'Nexconn SonicPro ANC Studio Wireless Headphones',
      productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      orderId: 'ord_sample_9841',
      status: 'active',
      aiHandlingEnabled: true,
      lastMessage: {
        text: 'Your tracking number is TRK-NEX-889921. Let us know if you need anything else!',
        senderId: 'user_vendor_1',
        timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
        type: 'text',
      },
      unreadCount: {
        user_consumer_1: 0,
        user_vendor_1: 0,
      },
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    };

    this.state.conversations = [initialConversation];

    this.state.messages = [
      {
        id: 'msg_1',
        conversationId: convId,
        senderId: 'user_consumer_1',
        senderName: 'Alex Johnson',
        senderRole: 'consumer',
        recipientId: 'vendor_nexconn_audio',
        text: 'Hi! Does this pair support simultaneous connection to both an iPad and an iPhone?',
        type: 'text',
        status: 'read',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'msg_2',
        conversationId: convId,
        senderId: 'agent_aria',
        senderName: 'Aria (AI Assistant)',
        senderRole: 'vendor',
        recipientId: 'user_consumer_1',
        text: 'Hello Alex! Yes, absolutely! The Nexconn SonicPro ANC features Bluetooth 5.4 multi-point pairing, which lets you seamlessly switch between your iPad and iPhone without manually disconnecting.',
        type: 'text',
        isAiGenerated: true,
        status: 'read',
        createdAt: new Date(Date.now() - 3 * 86400000 + 4000).toISOString(),
      },
      {
        id: 'msg_3',
        conversationId: convId,
        senderId: 'user_consumer_1',
        senderName: 'Alex Johnson',
        senderRole: 'consumer',
        recipientId: 'vendor_nexconn_audio',
        text: 'Awesome, just placed my order!',
        type: 'text',
        status: 'read',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'msg_4',
        conversationId: convId,
        senderId: 'user_vendor_1',
        senderName: 'Elena Rostova',
        senderRole: 'vendor',
        recipientId: 'user_consumer_1',
        text: 'Your tracking number is TRK-NEX-889921. Let us know if you need anything else!',
        type: 'text',
        status: 'read',
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ];

    // 7. Support Tickets
    this.state.supportTickets = [
      {
        ticketId: 'tkt_1001',
        consumerId: 'user_consumer_1',
        consumerName: 'Alex Johnson',
        consumerEmail: 'customer@convocart.com',
        conversationId: convId,
        orderId: 'ord_sample_9841',
        vendorId: 'vendor_nexconn_audio',
        assignedAgentId: 'user_support_1',
        assignedAgentName: 'Sarah Connor',
        priority: 'medium',
        status: 'in_progress',
        category: 'Delivery Inquiry',
        subject: 'FedEx delivery window verification',
        description: 'Customer inquired whether delivery signature is required for parcel TRK-NEX-889921.',
        internalNotes: [
          {
            id: 'note_1',
            authorId: 'user_support_1',
            authorName: 'Sarah Connor',
            note: 'FedEx confirmed no signature required; package will be safely delivered to front porch locker.',
            createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
          },
        ],
        slaDueHours: 24,
        createdAt: new Date(Date.now() - 16 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      },
    ];

    console.log('[DataStore] Seeded complete high-fidelity database');
  }

  // Getters & Query helpers
  public getUsers(): UserProfile[] {
    return this.state.users;
  }

  public findUserById(uid: string): UserProfile | undefined {
    return this.state.users.find((u) => u.uid === uid);
  }

  public findUserByEmail(email: string): UserProfile | undefined {
    return this.state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getPasswordHash(uid: string): string | undefined {
    return this.state.passwords[uid];
  }

  public addUser(user: UserProfile, passwordHash: string): void {
    this.state.users.push(user);
    this.state.passwords[user.uid] = passwordHash;
    this.persist();
  }

  public updateUser(uid: string, updates: Partial<UserProfile>): UserProfile | undefined {
    const idx = this.state.users.findIndex((u) => u.uid === uid);
    if (idx === -1) return undefined;
    this.state.users[idx] = { ...this.state.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.state.users[idx];
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
  }

  public updateVendor(vendorId: string, updates: Partial<Vendor>): Vendor | undefined {
    const idx = this.state.vendors.findIndex((v) => v.vendorId === vendorId);
    if (idx === -1) return undefined;
    this.state.vendors[idx] = { ...this.state.vendors[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
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
  }

  public updateProduct(productId: string, updates: Partial<Product>): Product | undefined {
    const idx = this.state.products.findIndex((p) => p.productId === productId);
    if (idx === -1) return undefined;
    this.state.products[idx] = { ...this.state.products[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
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
  }

  public updateOrder(orderId: string, updates: Partial<Order>): Order | undefined {
    const idx = this.state.orders.findIndex((o) => o.orderId === orderId);
    if (idx === -1) return undefined;
    this.state.orders[idx] = { ...this.state.orders[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
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
  }

  public updateConversation(conversationId: string, updates: Partial<Conversation>): Conversation | undefined {
    const idx = this.state.conversations.findIndex((c) => c.conversationId === conversationId);
    if (idx === -1) return undefined;
    this.state.conversations[idx] = { ...this.state.conversations[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.state.conversations[idx];
  }

  public getMessages(conversationId: string): Message[] {
    return this.state.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public addMessage(message: Message): void {
    this.state.messages.push(message);
    // Update conversation lastMessage & unread count
    const conv = this.findConversationById(message.conversationId);
    if (conv) {
      conv.lastMessage = {
        text: message.text,
        senderId: message.senderId,
        timestamp: message.createdAt,
        type: message.type,
      };
      conv.updatedAt = message.createdAt;
      // Increment unread count for the other party
      const recipientId = message.recipientId;
      conv.unreadCount[recipientId] = (conv.unreadCount[recipientId] || 0) + 1;
    }
    this.persist();
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
  }

  public updateSupportTicket(ticketId: string, updates: Partial<SupportTicket>): SupportTicket | undefined {
    const idx = this.state.supportTickets.findIndex((t) => t.ticketId === ticketId);
    if (idx === -1) return undefined;
    this.state.supportTickets[idx] = { ...this.state.supportTickets[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.state.supportTickets[idx];
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
