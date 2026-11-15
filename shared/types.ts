export type UserRole = 'consumer' | 'vendor' | 'support_agent' | 'admin';

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface UserProfile {
  uid: string;
  firebaseUid?: string;
  authProvider?: 'firebase' | 'google' | 'password';
  emailVerified?: boolean;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  role: UserRole;
  preferredLanguage: string;
  city?: string;
  country?: string;
  addresses?: Address[];
  vendorId?: string;
  rsaPublicKey?: string;
  rsaKeyFingerprint?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessPolicies {
  shipping: string;
  returns: string;
  warranty: string;
}

export type VendorAvailability = 'online' | 'busy' | 'away' | 'offline';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface Vendor {
  vendorId: string;
  ownerUid: string;
  businessName: string;
  description: string;
  logo: string;
  banner?: string;
  category: string;
  verificationStatus: VerificationStatus;
  rating: number;
  reviewCount: number;
  businessPolicies: BusinessPolicies;
  availability: VendorAvailability;
  aiAgentEnabled: boolean;
  commissionRate: number;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  options: string[];
  priceDiff?: number;
  stock?: number;
}

export type ProductStatus = 'active' | 'draft' | 'archived';

export interface Product {
  productId: string;
  vendorId: string;
  vendorName?: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  brand: string;
  sku: string;
  price: number;
  discount: number; // percentage (0 - 100)
  stock: number;
  images: string[];
  variants?: ProductVariant[];
  specifications: Record<string, string>;
  shippingPolicy: string;
  returnPolicy: string;
  status: ProductStatus;
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  isTrending?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  parentId?: string | null;
}

export interface CartItem {
  productId: string;
  vendorId: string;
  title: string;
  price: number;
  discount: number;
  image: string;
  quantity: number;
  selectedVariant?: Record<string, string>;
  maxStock: number;
}

export interface Cart {
  cartId: string;
  consumerId: string;
  items: CartItem[];
  updatedAt: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'rejected'
  | 'return_requested'
  | 'returned'
  | 'refund_pending'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded';

export interface OrderItem {
  productId: string;
  vendorId: string;
  title: string;
  price: number;
  discount: number;
  quantity: number;
  selectedVariant?: Record<string, string>;
  image?: string;
}

export interface Order {
  orderId: string;
  checkoutGroupId?: string;
  consumerId: string;
  consumerName?: string;
  consumerEmail?: string;
  consumerPhone?: string;
  vendorId: string;
  vendorName?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  shippingStatus: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  addressSnapshot: Address;
  paymentMethod: string;
  cancellationReason?: string;
  returnReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ConversationStatus = 'active' | 'escalated' | 'closed' | 'archived';

export interface Conversation {
  conversationId: string;
  consumerId: string;
  consumerName: string;
  consumerAvatar?: string;
  consumerEmail?: string;
  consumerPhone?: string;
  consumerAddressSummary?: string;
  consumerTotalOrders?: number;
  consumerTotalSpent?: number;
  vendorId: string;
  vendorOwnerUid?: string;
  vendorBusinessName: string;
  vendorLogo?: string;
  vendorAvailability?: VendorAvailability;
  consumerPublicKey?: string;
  vendorPublicKey?: string;
  consumerPreferredLanguage?: string;
  vendorPreferredLanguage?: string;
  supportAgentId?: string;
  assignedSupportAgentId?: string;
  assignedSupportAgentName?: string;
  dispatchedAt?: string;
  escalationReason?: string;
  escalatedAt?: string;
  autoTranslateEnabled?: boolean;
  productId?: string;
  productTitle?: string;
  productImage?: string;
  orderId?: string;
  status: ConversationStatus;
  aiHandlingEnabled: boolean;
  assignedAgent?: string;
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: string;
    type?: string;
  };
  unreadCount: Record<string, number>;
  escalatedToSupport?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MessageType =
  | 'text'
  | 'image'
  | 'file'
  | 'audio'
  | 'product_card'
  | 'order_card'
  | 'payment_request';

export interface MessageMetadata {
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  audioDuration?: number;
  productId?: string;
  productTitle?: string;
  productPrice?: number;
  productImage?: string;
  orderId?: string;
  orderStatus?: string;
  orderTotal?: number;
  orderItemsCount?: number;
  trackingNumber?: string;
  paymentAmount?: number;
  paymentOrderId?: string;
  paymentStatus?: string;
  detectedLanguage?: string;
  translatedText?: Record<string, string>;
  audioUrl?: string;
  voiceDuration?: number;
  fileUrl?: string;
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  encrypted?: boolean;
  rsaEncrypted?: boolean;
  encryptionAlgorithm?: 'RSA-OAEP-256' | 'RSA-OAEP-256+AES-256-GCM' | 'AES-GCM';
  rsaForRecipient?: string;
  rsaForSender?: string;
  rsaRecipientUid?: string;
  rsaSenderUid?: string;
  rsaKeyFingerprint?: string;
  storageProvider?: 'firebase' | 'local';
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  text: string;
  type: MessageType;
  mediaUrl?: string;
  metadata?: MessageMetadata;
  replyToMessageId?: string;
  reactions?: Record<string, string[]>; // emoji -> list of userIds
  isAiGenerated?: boolean;
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
  updatedAt?: string;
}

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved' | 'closed';

export interface InternalNote {
  id: string;
  authorId: string;
  authorName: string;
  note: string;
  createdAt: string;
}

export interface SupportTicketReply {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  isAdminOrAgent: boolean;
  message: string;
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
  editedAt?: string;
  deletedForEveryone?: boolean;
  createdAt: string;
}

export interface SupportTicket {
  ticketId: string;
  consumerId: string;
  consumerName: string;
  consumerEmail: string;
  conversationId?: string;
  orderId?: string;
  productId?: string;
  productTitle?: string;
  vendorId?: string;
  vendorOwnerUid?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: string;
  subject: string;
  description: string;
  rsaEncrypted?: boolean;
  encryptionAlgorithm?: 'RSA-OAEP-256' | 'RSA-OAEP-256+AES-256-GCM' | 'AES-GCM';
  rsaForRecipient?: string;
  rsaForSender?: string;
  rsaRecipientUid?: string;
  rsaSenderUid?: string;
  internalNotes: InternalNote[];
  replies?: SupportTicketReply[];
  attachedFileUrl?: string;
  attachedFileName?: string;
  slaDueHours: number;
  firebaseSynced?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupportFAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
  notHelpful: number;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  readTime: string;
  views: number;
  author?: string;
  updatedAt: string;
}

export interface FirebaseSyncStatus {
  connected: boolean;
  projectId: string;
  storageBucket: string;
  lastSyncedAt: string | null;
  syncedCounts: Record<string, number>;
  error?: string;
}

export interface AIAgentConfig {
  vendorId: string;
  enabled: boolean;
  agentName: string;
  avatarUrl: string;
  greetingMessage: string;
  personality: 'friendly' | 'professional' | 'concise' | 'technical';
  supportedLanguages: string[];
  businessHours: {
    enabled: boolean;
    start: string; // e.g. "09:00"
    end: string;   // e.g. "18:00"
    timezone: string;
  };
  responseStyle: 'concise' | 'detailed' | 'friendly' | 'professional';
  faqs: Array<{ question: string; answer: string }>;
  shippingPolicy: string;
  returnPolicy: string;
  warrantyInfo: string;
  escalationRules: string[];
  humanTakeoverActive: boolean;
  updatedAt: string;
}

export interface PaymentTransaction {
  paymentId: string;
  orderId: string;
  checkoutGroupId?: string;
  provider: 'razorpay' | 'cash_on_delivery' | 'card_test';
  providerOrderId?: string;
  providerPaymentId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  signature?: string;
  receipt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorOverviewStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  activeProducts: number;
  pendingOrders: number;
  completedOrders: number;
  newCustomers: number;
  unreadConversations: number;
  averageOrderValue: number;
  salesGrowthPercentage: number;
  avgResponseTimeSeconds?: number;
  chatToSaleConversionRate?: number;
  customerRetentionRate?: number;
  aiResolutionRate?: number;
  escalatedConversations?: number;
  translatedMessagesCount?: number;
}

export interface DispatchAgentInfo {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  photoURL?: string;
  preferredLanguage: string;
  supportedLanguages: string[];
  availability: 'online' | 'busy' | 'away' | 'offline';
  activeChats: number;
  assignedTickets: number;
}

export interface DispatchOverviewStats {
  escalatedChatsCount: number;
  waitingInQueueCount: number;
  activeDispatchedCount: number;
  resolvedTodayCount: number;
  avgSlaHours: number;
  onlineAgentsCount: number;
  multiLanguageChatsCount: number;
}
