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
  { id: 'ceramics-pottery', name: 'Ceramics & Pottery', slug: 'ceramics-pottery', icon: 'Sparkles', description: 'Handmade Stoneware, Teaware, Vases & Terracotta' },
  { id: 'sculptures-candles', name: 'Sculptures & Candles', slug: 'sculptures-candles', icon: 'Flame', description: 'Soy Wax Candles, Scented Vessels & Sculptures' },
  { id: 'artisan-jewellery', name: 'Artisan Jewellery', slug: 'artisan-jewellery', icon: 'Gem', description: 'Handcrafted Earrings, Rings, Necklaces & Pendants' },
  { id: 'textiles-weaving', name: 'Textiles & Weaving', slug: 'textiles-weaving', icon: 'Scissors', description: 'Handwoven Rugs, Macramé, Cushion Covers & Table Runners' },
  { id: 'fine-art-prints', name: 'Fine Art & Prints', slug: 'fine-art-prints', icon: 'Palette', description: 'Original Canvas Paintings, Miniature Art & Plates' },
  { id: 'leather-woodcraft', name: 'Leather, Wood & Gifts', slug: 'leather-woodcraft', icon: 'Package', description: 'Handmade Leather Journals, Serving Trays & Gift Boxes' },
];

export const NEXCONN_APP_CONFIG = {
  appKey: typeof process !== 'undefined' && process.env?.NEXCONN_APP_KEY ? process.env.NEXCONN_APP_KEY : '',
  appSecret: typeof process !== 'undefined' && process.env?.NEXCONN_APP_SECRET ? process.env.NEXCONN_APP_SECRET : '',
  accessKey: typeof process !== 'undefined' && process.env?.NEXCONN_ACCESS_KEY ? process.env.NEXCONN_ACCESS_KEY : '',
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
