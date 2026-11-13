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
  accessKey: 'KCPAU3HTYNPRP5WUBGPCCTCHUMIJHUZ7JIDRAI2UTSN5WEMMJ7STQHL4OKMLHYJK2QF4ZEJEFYA57ZFPTGRRRRTDXUUROPL55UVPN5I',
};

export const DEFAULT_COMMISSION_RATE = 0.05; // 5% marketplace commission
export const DEFAULT_TAX_RATE = 0.08; // 8% sales tax
export const FREE_SHIPPING_THRESHOLD = 500;
export const STANDARD_SHIPPING_FEE = 49;
