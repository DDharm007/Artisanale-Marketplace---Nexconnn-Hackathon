import { OrderStatus } from './types';

export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled', 'rejected'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['return_requested'],
  return_requested: ['returned', 'rejected'],
  returned: ['refund_pending'],
  refund_pending: ['refunded'],
  refunded: [],
  cancelled: [],
  rejected: [],
};

export const DEFAULT_CATEGORIES = [
  { id: 'cat-electronics', name: 'Electronics & Gadgets', slug: 'electronics', icon: 'Cpu', description: 'Smartphones, Audio, Wearables & Accessories' },
  { id: 'cat-fashion', name: 'Fashion & Apparel', slug: 'fashion', icon: 'Shirt', description: 'Men, Women, Footwear & Accessories' },
  { id: 'cat-home', name: 'Home & Kitchen', slug: 'home-kitchen', icon: 'Home', description: 'Smart Appliances, Decor, Cookware' },
  { id: 'cat-beauty', name: 'Beauty & Personal Care', slug: 'beauty', icon: 'Sparkles', description: 'Skincare, Fragrances, Haircare' },
  { id: 'cat-global', name: 'Ubuy Global Express', slug: 'global-express', icon: 'Globe', description: 'Curated International Brands & Import Exclusives' },
  { id: 'cat-books', name: 'Books & Stationery', slug: 'books', icon: 'BookOpen', description: 'Bestsellers, Office supplies & Tech notebooks' },
];

export const NEXCONN_APP_CONFIG = {
  appKey: '8w7jv4qb8gtvy',
  appSecret: '6bNYoqv739Ng',
  accessKey: 'ASPGNSOBMWBGVB4KVVHIWB2XNMTJDHOA5MGCDG63NGY6LJZDZAS3AOPDJA4BIXHG3VUHQRCUROZBLF2RTYXS3EUTILRQLIYJCEHPNLQ',
};

export const DEFAULT_COMMISSION_RATE = 0.05; // 5% marketplace commission
export const DEFAULT_TAX_RATE = 0.08; // 8% sales tax
export const FREE_SHIPPING_THRESHOLD = 500;
export const STANDARD_SHIPPING_FEE = 49;

export interface ChatLanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_CHAT_LANGUAGES: ChatLanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];
