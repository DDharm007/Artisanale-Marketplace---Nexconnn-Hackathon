import { describe, it, expect } from 'vitest';
import {
  ORDER_STATUS_FLOW,
  DEFAULT_TAX_RATE,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  NEXCONN_APP_CONFIG,
} from '../../shared';
import { razorpayService } from '../src/services/razorpayService';
import { aiAgentService } from '../src/services/aiAgentService';
import { nexconnService } from '../src/services/nexconnService';
import { translationService } from '../src/services/translationService';
import { firebaseService } from '../src/services/firebaseService';
import { rsaService } from '../src/services/rsaService';
import { db } from '../src/services/dataStore';
import { conversationController } from '../src/modules/conversations/conversationController';
import { authController } from '../src/modules/auth/authController';
import { vendorController } from '../src/modules/vendors/vendorController';
import { supportController } from '../src/modules/support/supportController';

describe('1. Price & Cart Calculations', () => {
  it('calculates discount and subtotal accurately', () => {
    const originalPrice = 299;
    const discountPercent = 15;
    const discountedPrice = Number((originalPrice * (1 - discountPercent / 100)).toFixed(2));
    expect(discountedPrice).toBe(254.15);

    const quantity = 2;
    const subtotal = discountedPrice * quantity;
    expect(subtotal).toBe(508.3);

    const tax = Number((subtotal * DEFAULT_TAX_RATE).toFixed(2));
    expect(tax).toBe(40.66);

    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
    expect(shipping).toBe(0); // Above $500 free shipping threshold

    const total = Number((subtotal + tax + shipping).toFixed(2));
    expect(total).toBe(548.96);
  });

  it('applies standard shipping fee for orders under free threshold', () => {
    const subtotal = 120;
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
    expect(shipping).toBe(STANDARD_SHIPPING_FEE);
  });
});

describe('2. Order State Machine Transitions', () => {
  it('permits valid next transitions', () => {
    expect(ORDER_STATUS_FLOW['pending']).toContain('confirmed');
    expect(ORDER_STATUS_FLOW['confirmed']).toContain('processing');
    expect(ORDER_STATUS_FLOW['processing']).toContain('shipped');
    expect(ORDER_STATUS_FLOW['shipped']).toContain('delivered');
    expect(ORDER_STATUS_FLOW['delivered']).toContain('return_requested');
  });

  it('prohibits invalid transitions', () => {
    expect(ORDER_STATUS_FLOW['delivered']).not.toContain('pending');
    expect(ORDER_STATUS_FLOW['cancelled']).toHaveLength(0);
  });
});

describe('3. Payment Signature Verification', () => {
  it('validates test signature correctly', () => {
    const orderId = 'ord_test_123';
    const paymentId = 'pay_test_456';
    const testValidSignature = 'sig_test_valid_sandbox_99';
    const isValid = razorpayService.verifySignature(orderId, paymentId, testValidSignature);
    expect(isValid).toBe(true);
  });

  it('rejects empty or corrupt payment signatures', () => {
    const isValid = razorpayService.verifySignature('ord_1', 'pay_1', '');
    expect(isValid).toBe(false);
  });
});

describe('4. AI Vendor Agent Grounding & Escalation', () => {
  it('escalates refund and dispute requests to human vendor', async () => {
    const result = await aiAgentService.generateGroundedResponse(
      'vendor_nexconn_audio',
      'I want a refund because my item is damaged'
    );
    expect(result.escalateToHuman).toBe(true);
    expect(result.replyText).toContain('cannot approve refunds');
  });

  it('answers grounded product questions without inventing facts', async () => {
    const tempProductId = `prod_test_ground_${Date.now()}`;
    db.addProduct({
      productId: tempProductId,
      vendorId: 'vendor_nexconn_audio',
      vendorName: 'Nexconn Audio & Smart Tech',
      title: 'Test Seller SonicPro Reference Headset',
      description: 'Seller-uploaded test studio headset',
      categoryId: 'cat-electronics',
      categoryName: 'Electronics & Gadgets',
      brand: 'SonicTest',
      sku: `TST-${Date.now()}`,
      price: 299,
      discount: 0,
      stock: 15,
      images: [],
      specifications: { Battery: '40 Hours' },
      shippingPolicy: 'Express shipping',
      returnPolicy: '30-day return',
      status: 'active',
      rating: 5.0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    try {
      const result = await aiAgentService.generateGroundedResponse(
        'vendor_nexconn_audio',
        'What is the price of Test Seller SonicPro?',
        { productId: tempProductId }
      );
      expect(result.isAiGenerated).toBe(true);
      expect(result.replyText).toContain('SonicPro');
      expect(result.replyText).toContain('$299');
    } finally {
      db.deleteProduct(tempProductId);
    }
  });
});

describe('5. Database Store Integrity (Zero Static Products)', () => {
  it('contains zero legacy static products and supports dynamic seller uploads', () => {
    const users = db.getUsers();
    expect(users.length).toBeGreaterThanOrEqual(4);

    const staticIds = [
      'prod_nexconn_pro_anc',
      'prod_tokyo_mech_keyboard',
      'prod_smartwatch_ultra',
      'prod_espresso_machine_pro',
      'prod_merino_wool_jacket',
      'prod_skincare_elixir',
      'prod_nexa_omnidesk',
      'prod_nexa_lumiere',
      'prod_nexa_sonic_kit',
    ];
    const products = db.getProducts();
    for (const staticId of staticIds) {
      expect(products.some((p) => p.productId === staticId)).toBe(false);
    }

    const vendor = db.findVendorById('vendor_nexconn_audio');
    expect(vendor).toBeDefined();
    expect(vendor?.businessName).toContain('Nexconn');
  });

  it('includes seeded multilingual dispatch staff and resolves email aliases cleanly', () => {
    const kenji = db.findUserByEmail('kenji@convocart.com');
    expect(kenji).toBeDefined();
    expect(kenji?.role).toBe('support_agent');

    const vendorAlias = db.findUserByEmail('vendor@nexconnaudio.com');
    expect(vendorAlias).toBeDefined();
    expect(vendorAlias?.vendorId).toBe('vendor_nexconn_audio');
  });
});

describe('6. Multi-Language Translation & Dispatch Escalation', () => {
  it('detects languages and translates commerce text accurately', async () => {
    expect(translationService.detectLanguage('Hola, ¿cuál es el precio del envío?')).toBe('es');
    expect(translationService.detectLanguage('こんにちは、発送はいつですか？')).toBe('ja');

    const translated = await translationService.translateText('Hello', 'es', 'en');
    expect(translated.translatedText).toBeTruthy();
    expect(translated.detectedSourceLanguage).toBe('en');
  });

  it('escalates human-agent requests and returns multilingual AI metadata', async () => {
    const res = await aiAgentService.generateGroundedResponse(
      'vendor_nexconn_audio',
      'Please connect me to a human support agent right away'
    );
    expect(res.escalateToHuman).toBe(true);
    expect(res.detectedLanguage).toBe('en');
    expect(res.translatedReply?.en).toBeTruthy();
  });
});

describe('7. Firebase (society-adc76), Nexconn SDK Key & Support Command Center CRUD', () => {
  it('configures the official Nexconn Hackathon access key in shared config', () => {
    expect(NEXCONN_APP_CONFIG.accessKey).toBe(
      'ASPGNSOBMWBGVB4KVVHIWB2XNMTJDHOA5MGCDG63NGY6LJZDZAS3AOPDJA4BIXHG3VUHQRCUROZBLF2RTYXS3EUTILRQLIYJCEHPNLQ'
    );
  });

  it('configures Firebase Firestore sync status for society-adc76', () => {
    const status = firebaseService.getStatus();
    expect(status.connected).toBe(true);
    expect(status.projectId).toBe('society-adc76');
    expect(status.storageBucket).toBe('society-adc76.firebasestorage.app');
  });

  it('creates product-linked support tickets routed to the seller and includes FAQs & Knowledge Base', () => {
    const tempProdId = `prod_tkt_test_${Date.now()}`;
    db.addProduct({
      productId: tempProdId,
      vendorId: 'vendor_nexconn_audio',
      vendorName: 'Nexconn Audio & Smart Tech',
      title: 'Seller Uploaded Acoustic Dac Amp',
      description: 'Hi-Fi desktop headphone amp uploaded by seller',
      categoryId: 'cat-electronics',
      categoryName: 'Electronics & Gadgets',
      brand: 'AudioLab',
      sku: `AUD-${Date.now()}`,
      price: 179,
      discount: 0,
      stock: 10,
      images: [],
      specifications: {},
      shippingPolicy: 'Next day air',
      returnPolicy: '30 days',
      status: 'active',
      rating: 5,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    let createdTicket: any = null;
    try {
      const mockTicketRes: any = {
        status: () => mockTicketRes,
        json: (data: any) => {
          createdTicket = data;
          return mockTicketRes;
        },
      };
      supportController.createTicket(
        {
          user: db.findUserById('user_consumer_1'),
          body: {
            productId: tempProdId,
            category: 'Product Inquiry & Specs',
            priority: 'high',
            subject: 'Question about DAC sample rate',
            description: 'Does it support 32-bit PCM over USB-C?',
          },
        } as any,
        mockTicketRes
      );
      expect(createdTicket).toBeTruthy();
      expect(createdTicket.productId).toBe(tempProdId);
      expect(createdTicket.productTitle).toBe('Seller Uploaded Acoustic Dac Amp');
      expect(createdTicket.vendorId).toBe('vendor_nexconn_audio');

      const faqs = db.getFAQs();
      expect(faqs.length).toBeGreaterThanOrEqual(4);

      const beforeHelpful = faqs[0].helpful;
      const voted = db.voteFAQ(faqs[0].id, 'helpful');
      expect(voted?.helpful).toBe(beforeHelpful + 1);

      const articles = db.getKBArticles();
      expect(articles.length).toBeGreaterThanOrEqual(3);
    } finally {
      if (createdTicket?.ticketId) db.deleteSupportTicket(createdTicket.ticketId);
      db.deleteProduct(tempProdId);
    }
  });

  it('supports full FAQ, Knowledge Base, and Ticket Reply CRUD operations', () => {
    const now = new Date().toISOString();
    const faqId = `faq_test_${Date.now()}`;
    const createdFaq = db.addFAQ({
      id: faqId,
      question: 'How fast does Nexconn human dispatch respond?',
      answer: 'Under 4 hours for Urgent priority tickets.',
      category: 'Policies & SLA',
      helpful: 0,
      notHelpful: 0,
    });
    expect(createdFaq.id).toBe(faqId);

    const updatedFaq = db.updateFAQ(createdFaq.id, {
      answer: 'Under 2 hours for Urgent priority SLA tickets.',
    });
    expect(updatedFaq?.answer).toContain('2 hours');
    expect(db.deleteFAQ(createdFaq.id)).toBe(true);

    const artId = `kb_test_${Date.now()}`;
    const createdArticle = db.addKBArticle({
      id: artId,
      title: 'Nexconn Channel Setup Guide',
      summary: 'Quick setup checklist',
      content: 'Detailed guide body',
      category: 'API & Integrations',
      tags: ['nexconn', 'sdk'],
      readTime: '3 min read',
      views: 0,
      author: 'Nexconn Staff',
      updatedAt: now,
    });
    expect(createdArticle.id).toBe(artId);

    const updatedArticle = db.updateKBArticle(createdArticle.id, {
      title: 'Nexconn Channel Setup Guide v2',
    });
    expect(updatedArticle?.title).toBe('Nexconn Channel Setup Guide v2');
    expect(db.deleteKBArticle(createdArticle.id)).toBe(true);

    const tempTicketId = `tkt_test_${Date.now()}`;
    db.addSupportTicket({
      ticketId: tempTicketId,
      consumerId: 'user_consumer_1',
      consumerName: 'Alex Johnson',
      consumerEmail: 'alex@convocart.com',
      subject: 'Unit test ticket',
      category: 'Order & Shipping',
      priority: 'high',
      status: 'open',
      description: 'Testing ticket reply CRUD',
      internalNotes: [],
      replies: [],
      slaDueHours: 8,
      createdAt: now,
      updatedAt: now,
    });

    const replyId = `rep_test_${Date.now()}`;
    const withReply = db.addSupportTicketReply(tempTicketId, {
      id: replyId,
      senderId: 'user_support_1',
      senderName: 'Maya (Dispatch)',
      senderRole: 'support_agent',
      isAdminOrAgent: true,
      message: 'Encrypted or plaintext specialist reply',
      encrypted: false,
      createdAt: now,
    });
    expect(withReply?.replies?.some((r) => r.id === replyId)).toBe(true);
    expect(withReply?.status).toBe('in_progress');

    const withEdited = db.updateSupportTicketReply(tempTicketId, replyId, {
      message: 'Updated specialist reply',
      editedAt: new Date().toISOString(),
    });
    const editedReply = withEdited?.replies?.find((r) => r.id === replyId);
    expect(editedReply?.message).toBe('Updated specialist reply');
    expect(editedReply?.editedAt).toBeTruthy();

    const withRecalled = db.updateSupportTicketReply(tempTicketId, replyId, {
      deletedForEveryone: true,
    });
    const recalledReply = withRecalled?.replies?.find((r) => r.id === replyId);
    expect(recalledReply?.deletedForEveryone).toBe(true);

    expect(db.deleteSupportTicket(tempTicketId)).toBe(true);
  });

  it('supports editing and recalling messages in a conversation', () => {
    const tempMsgId = `msg_test_${Date.now()}`;
    db.addMessage({
      id: tempMsgId,
      conversationId: 'conv_test_ephemeral',
      senderId: 'user_consumer_1',
      senderName: 'Alex Johnson',
      senderRole: 'consumer',
      recipientId: 'user_vendor_1',
      text: 'Original draft message',
      type: 'text',
      status: 'delivered',
      createdAt: new Date().toISOString(),
    });

    const edited = db.updateMessage(tempMsgId, {
      text: 'Updated edited message',
      metadata: { isEdited: true, editedAt: new Date().toISOString() },
    });
    expect(edited?.text).toBe('Updated edited message');
    expect(edited?.metadata?.isEdited).toBe(true);

    const recalled = db.updateMessage(tempMsgId, {
      text: 'This message was recalled',
      metadata: { isDeleted: true },
    });
    expect(recalled?.metadata?.isDeleted).toBe(true);
    expect(db.deleteMessage(tempMsgId)).toBe(true);
  });

  it('triggers escalation on natural cancellation phrases and avoids repeated greetings', async () => {
    const cancelResult = await aiAgentService.generateGroundedResponse(
      'vendor_nexa_studio',
      "I don't want my product"
    );
    expect(cancelResult.escalateToHuman).toBe(true);
    expect(cancelResult.replyText.toLowerCase()).toContain('dispatched');

    const hiResult = await aiAgentService.generateGroundedResponse('vendor_nexa_studio', 'hi');
    expect(hiResult.escalateToHuman).toBe(false);
    expect(hiResult.replyText).not.toContain('Namaste & Welcome to NexaDigital Studio!');
    expect(hiResult.replyText.toLowerCase()).toContain('online');
  });

  it('produces immediate multilingual specialist reply for escalated chats and issues local Nexconn token cleanly', async () => {
    const specialistReply = await aiAgentService.generateHumanSpecialistAutoReply({
      specialistName: 'Sarah Jenkins',
      vendorBusinessName: 'NexaDigital Commerce & AI Studio',
      customerName: 'Alex Johnson',
      customerMessage: 'hi',
      preferredLanguage: 'en',
      ticketId: 'tkt_test_99',
      recentCustomerMessages: ["I don't want my product"],
    });
    expect(specialistReply.replyText).toContain('Sarah Jenkins');
    expect(specialistReply.replyText.toLowerCase()).toContain('refund');

    const tokenRes = await nexconnService.issueUserToken('user_consumer_1', 'Alex Johnson');
    expect(tokenRes.code).toBe(200);
    expect(tokenRes.token.startsWith('nxc_live_')).toBe(true);
  });

  it('toggles conversation AI handling settings cleanly via PATCH endpoint handler', async () => {
    const tempConvId = `conv_test_toggle_${Date.now()}`;
    db.addConversation({
      conversationId: tempConvId,
      consumerId: 'user_consumer_1',
      consumerName: 'Alex Johnson',
      vendorId: 'vendor_nexconn_audio',
      vendorBusinessName: 'Nexconn Audio & Smart Tech',
      status: 'active',
      aiHandlingEnabled: true,
      unreadCount: { user_consumer_1: 0, user_vendor_1: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    try {
      let jsonPayload: any = null;
      const mockRes: any = {
        status: () => mockRes,
        json: (data: any) => {
          jsonPayload = data;
          return mockRes;
        },
      };
      await conversationController.updateConversationSettings(
        {
          user: db.findUserById('user_vendor_1'),
          params: { conversationId: tempConvId },
          body: { aiHandlingEnabled: false },
        } as any,
        mockRes
      );
      expect(jsonPayload?.conversation?.aiHandlingEnabled).toBe(false);
    } finally {
      db.deleteConversation(tempConvId);
    }
  });

  it('dynamically creates a Firebase customer profile via syncFirebaseUser with normalized addresses', async () => {
    const testFbUid = `fb_uid_test_${Date.now()}`;
    const testEmail = `dynamic_${Date.now()}@example.com`;
    let syncPayload: any = null;
    const mockRes: any = {
      status: () => mockRes,
      json: (data: any) => {
        syncPayload = data;
        return mockRes;
      },
    };

    await authController.syncFirebaseUser(
      {
        body: {
          firebaseUid: testFbUid,
          email: testEmail,
          displayName: 'Priya Sharma',
          phoneNumber: '+91 98765 00112',
          preferredLanguage: 'hi',
          authProvider: 'firebase',
          emailVerified: true,
          address: {
            street: '42 MG Road',
            city: 'Bengaluru',
            state: 'KA',
            postalCode: '560001',
            country: 'India',
          },
        },
      } as any,
      mockRes
    );

    expect(syncPayload?.user?.uid).toBeTruthy();
    expect(syncPayload?.user?.firebaseUid).toBe(testFbUid);
    expect(syncPayload?.user?.addresses?.length).toBe(1);
    expect(syncPayload?.user?.addresses?.[0]?.city).toBe('Bengaluru');
    expect(syncPayload?.token).toBeTruthy();
    expect(syncPayload?.nexconnToken?.startsWith('nxc_live_')).toBe(true);

    const foundByFb = db.findUserByFirebaseUid(testFbUid);
    expect(foundByFb?.email).toBe(testEmail);
    expect(foundByFb?.city).toBe('Bengaluru');

    expect(db.deleteUser(syncPayload.user.uid)).toBe(true);
  });

  it('propagates user profile updates to seller customers CRM and conversation enrichment without leaking credentials', async () => {
    const origUser = db.findUserById('user_consumer_1');
    expect(origUser).toBeTruthy();
    const prevName = origUser!.displayName;
    const prevPhone = origUser!.phoneNumber;

    const updatedName = 'Alex J. Verified';
    const updatedPhone = '+1 555 867 5309';

    const tempConvId = `conv_crm_test_${Date.now()}`;
    db.addConversation({
      conversationId: tempConvId,
      consumerId: 'user_consumer_1',
      consumerName: origUser!.displayName,
      vendorId: 'vendor_nexconn_audio',
      vendorBusinessName: 'Nexconn Audio & Smart Tech',
      status: 'active',
      aiHandlingEnabled: false,
      unreadCount: { user_consumer_1: 0, user_vendor_1: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    try {
      await db.updateUser('user_consumer_1', {
        displayName: updatedName,
        phoneNumber: updatedPhone,
      });

      let customersPayload: any[] = [];
      const mockCustomersRes: any = {
        status: () => mockCustomersRes,
        json: (data: any) => {
          customersPayload = data;
          return mockCustomersRes;
        },
      };
      vendorController.getVendorCustomers(
        {
          params: { vendorId: 'vendor_nexconn_audio' },
          user: db.findUserById('user_vendor_1'),
        } as any,
        mockCustomersRes
      );

      const enrichedCust = customersPayload.find((c) => c.uid === 'user_consumer_1');
      expect(enrichedCust).toBeTruthy();
      expect(enrichedCust.name).toBe(updatedName);
      expect(enrichedCust.email).toBe(origUser!.email);
      expect(enrichedCust.phoneNumber).toBe(updatedPhone);
      expect(enrichedCust.shippingAddress).toBeTruthy();
      expect(enrichedCust.passwordHash).toBeUndefined();

      let convsPayload: any[] = [];
      const mockConvsRes: any = {
        status: () => mockConvsRes,
        json: (data: any) => {
          convsPayload = data;
          return mockConvsRes;
        },
      };
      conversationController.getConversations(
        {
          user: db.findUserById('user_vendor_1'),
        } as any,
        mockConvsRes
      );

      const enrichedConv = convsPayload.find((c) => c.consumerId === 'user_consumer_1');
      expect(enrichedConv).toBeTruthy();
      expect(enrichedConv.consumerName).toBe(updatedName);
      expect(enrichedConv.consumerEmail).toBe(origUser!.email);
      expect(enrichedConv.consumerPhone).toBe(updatedPhone);
    } finally {
      db.deleteConversation(tempConvId);
      await db.updateUser('user_consumer_1', {
        displayName: prevName,
        phoneNumber: prevPhone || '',
      });
    }
  });

  it('detects missing accounts and incomplete Google/social profiles for onboarding prompts', async () => {
    const unknownEmail = `missing_${Date.now()}@example.com`;
    let checkMissing: any = null;
    const mockCheckRes: any = {
      status: () => mockCheckRes,
      json: (data: any) => {
        checkMissing = data;
        return mockCheckRes;
      },
    };
    await authController.checkAccount({ body: { email: unknownEmail } } as any, mockCheckRes);
    expect(checkMissing?.exists).toBe(false);
    expect(checkMissing?.needsProfileCompletion).toBe(true);

    let loginStatus = 200;
    let loginPayload: any = null;
    const mockLoginRes: any = {
      status: (s: number) => {
        loginStatus = s;
        return mockLoginRes;
      },
      json: (data: any) => {
        loginPayload = data;
        return mockLoginRes;
      },
    };
    await authController.login(
      { body: { email: unknownEmail, password: 'Password123!' } } as any,
      mockLoginRes
    );
    expect(loginStatus).toBe(404);
    expect(loginPayload?.code).toBe('ACCOUNT_NOT_FOUND');
  });
});

describe('10. RSA-2048 Asymmetric Encryption (Strict Receiver/Sender Key Isolation)', () => {
  it('encrypts with Receiver public key (decryptable ONLY with Receiver private key) and reverses cleanly with Sender public/private keys', () => {
    const senderKeys = rsaService.generateRsaKeyPair();
    const receiverKeys = rsaService.generateRsaKeyPair();
    const eavesdropperKeys = rsaService.generateRsaKeyPair();

    expect(rsaService.isValidPublicKey(senderKeys.publicKey)).toBe(true);
    expect(rsaService.isValidPublicKey(receiverKeys.publicKey)).toBe(true);
    expect(senderKeys.fingerprint).not.toBe(receiverKeys.fingerprint);

    // 1. Sender -> Receiver (Direct RSA-OAEP-256)
    const msgToReceiver = 'Hi seller, is the batch #42 warranty valid in India?';
    const cipherForReceiver = rsaService.encryptWithPublicKey(msgToReceiver, receiverKeys.publicKey);
    expect(cipherForReceiver.startsWith('RSA2048:')).toBe(true);
    expect(cipherForReceiver).not.toContain(msgToReceiver);

    // ONLY Receiver's private key decrypts
    expect(rsaService.decryptWithPrivateKey(cipherForReceiver, receiverKeys.privateKey)).toBe(msgToReceiver);
    // Sender's own private key & 3rd-party key MUST fail
    expect(() => rsaService.decryptWithPrivateKey(cipherForReceiver, senderKeys.privateKey)).toThrow();
    expect(() => rsaService.decryptWithPrivateKey(cipherForReceiver, eavesdropperKeys.privateKey)).toThrow();

    // 2. Receiver -> Sender reply (RSA-OAEP-256)
    const replyToSender = 'Yes! 2-year international warranty included with invoice #INV-998.';
    const cipherForSender = rsaService.encryptWithPublicKey(replyToSender, senderKeys.publicKey);
    expect(cipherForSender.startsWith('RSA2048:')).toBe(true);

    // ONLY Sender's private key decrypts
    expect(rsaService.decryptWithPrivateKey(cipherForSender, senderKeys.privateKey)).toBe(replyToSender);
    // Receiver's private key MUST fail on reply encrypted for Sender
    expect(() => rsaService.decryptWithPrivateKey(cipherForSender, receiverKeys.privateKey)).toThrow();
    expect(() => rsaService.decryptWithPrivateKey(cipherForSender, eavesdropperKeys.privateKey)).toThrow();

    // 3. Long support payload (> 250 bytes -> Hybrid RSA-OAEP-256+AES-256-GCM)
    const longSupportPayload = 'Confidential support claim details: '.repeat(10) + 'Order #9921-XYZ';
    const cipherLong = rsaService.encryptWithPublicKey(longSupportPayload, receiverKeys.publicKey);
    expect(rsaService.decryptWithPrivateKey(cipherLong, receiverKeys.privateKey)).toBe(longSupportPayload);
    expect(() => rsaService.decryptWithPrivateKey(cipherLong, senderKeys.privateKey)).toThrow();
  });

  it('publishes user RSA public keys, preserves RSA ciphertexts in chat & support tickets without server scrambling', async () => {
    const sender = db.findUserById('user_consumer_1');
    const vendor = db.getVendors()[0];
    expect(sender).toBeTruthy();
    expect(vendor).toBeTruthy();

    const receiverUid = vendor.ownerUid;
    const prevSenderPub = sender!.rsaPublicKey;
    const prevReceiverPub = db.findUserById(receiverUid)?.rsaPublicKey;

    const senderKeys = rsaService.generateRsaKeyPair();
    const receiverKeys = rsaService.generateRsaKeyPair();

    const tempConvId = `conv_rsa_test_${Date.now()}`;
    const createdTicketIds: string[] = [];

    try {
      // Publish public keys via controller
      let pubPayload: any = null;
      await authController.publishPublicKey(
        { user: sender, body: { rsaPublicKey: senderKeys.publicKey } } as any,
        { json: (d: any) => (pubPayload = d), status: () => ({ json: (d: any) => (pubPayload = d) }) } as any
      );
      expect(pubPayload?.rsaPublicKey).toBe(senderKeys.publicKey);

      const receiverUser = db.findUserById(receiverUid)!;
      await authController.publishPublicKey(
        { user: receiverUser, body: { rsaPublicKey: receiverKeys.publicKey } } as any,
        { json: () => undefined, status: () => ({ json: () => undefined }) } as any
      );

      // Lookup by vendorId resolves owner's RSA public key
      let lookedUp: any = null;
      await authController.getPublicKey(
        { user: sender, params: { targetId: vendor.vendorId } } as any,
        { json: (d: any) => (lookedUp = d), status: () => ({ json: (d: any) => (lookedUp = d) }) } as any
      );
      expect(lookedUp?.uid).toBe(receiverUid);
      expect(lookedUp?.rsaPublicKey).toBe(receiverKeys.publicKey);

      // Create conversation & send RSA encrypted message (Receiver's public key)
      db.addConversation({
        conversationId: tempConvId,
        consumerId: sender!.uid,
        consumerName: sender!.displayName,
        vendorId: vendor.vendorId,
        vendorBusinessName: vendor.businessName,
        status: 'active',
        aiHandlingEnabled: false,
        unreadCount: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const secretChatText = 'Private delivery gate code: #8841';
      const cipherText = rsaService.encryptWithPublicKey(secretChatText, lookedUp.rsaPublicKey);
      let msgResp: any = null;
      await conversationController.sendMessage(
        {
          user: sender,
          params: { conversationId: tempConvId },
          body: {
            text: cipherText,
            type: 'text',
            metadata: {
              encrypted: true,
              rsaEncrypted: true,
              encryptionAlgorithm: 'RSA-OAEP-256',
              rsaForRecipient: cipherText,
              rsaRecipientUid: receiverUid,
              rsaSenderUid: sender!.uid,
            },
          },
        } as any,
        {
          status: () => ({ json: (d: any) => (msgResp = d) }),
          json: (d: any) => (msgResp = d),
        } as any
      );

      expect(msgResp?.sentMessage?.text).toBe(cipherText);
      expect(msgResp?.sentMessage?.metadata?.rsaEncrypted).toBe(true);
      expect(msgResp?.aiReply).toBeFalsy();
      expect(
        rsaService.decryptWithPrivateKey(msgResp.sentMessage.text, receiverKeys.privateKey)
      ).toBe(secretChatText);

      // Support ticket + reply encrypted with opposite party's public key
      const secretSupportIssue = 'Private refund bank note';
      const ticketCipher = rsaService.encryptWithPublicKey(secretSupportIssue, receiverKeys.publicKey);
      let tktResp: any = null;
      supportController.createTicket(
        {
          user: sender,
          body: {
            subject: 'RSA Ticket Test',
            category: 'Other',
            description: ticketCipher,
            rsaEncrypted: true,
            encryptionAlgorithm: 'RSA-OAEP-256',
            rsaForRecipient: ticketCipher,
            rsaRecipientUid: receiverUid,
            rsaSenderUid: sender!.uid,
          },
        } as any,
        {
          status: () => ({ json: (d: any) => (tktResp = d) }),
          json: (d: any) => (tktResp = d),
        } as any
      );
      expect(tktResp?.ticketId).toBeTruthy();
      createdTicketIds.push(tktResp.ticketId);
      expect(rsaService.decryptWithPrivateKey(tktResp.description, receiverKeys.privateKey)).toBe(
        secretSupportIssue
      );

      // Receiver replies back to Sender using Sender's Public Key
      const replyPlain = 'Refund verified with receipt #R-501';
      const replyCipher = rsaService.encryptWithPublicKey(replyPlain, senderKeys.publicKey);
      let replyResp: any = null;
      supportController.addTicketReply(
        {
          user: receiverUser,
          params: { ticketId: tktResp.ticketId },
          body: {
            message: replyCipher,
            encrypted: true,
            rsaEncrypted: true,
            encryptionAlgorithm: 'RSA-OAEP-256',
            rsaForRecipient: replyCipher,
            rsaRecipientUid: sender!.uid,
            rsaSenderUid: receiverUid,
          },
        } as any,
        {
          status: () => ({ json: (d: any) => (replyResp = d) }),
          json: (d: any) => (replyResp = d),
        } as any
      );

      const savedReply = replyResp?.replies?.[0];
      expect(savedReply?.rsaEncrypted).toBe(true);
      expect(rsaService.decryptWithPrivateKey(savedReply.message, senderKeys.privateKey)).toBe(
        replyPlain
      );
      expect(() =>
        rsaService.decryptWithPrivateKey(savedReply.message, receiverKeys.privateKey)
      ).toThrow();
    } finally {
      db.deleteConversation(tempConvId);
      for (const tid of createdTicketIds) {
        db.deleteSupportTicket(tid);
      }
      await db.updateUser(sender!.uid, { rsaPublicKey: prevSenderPub });
      await db.updateUser(receiverUid, { rsaPublicKey: prevReceiverPub });
    }
  });
});
