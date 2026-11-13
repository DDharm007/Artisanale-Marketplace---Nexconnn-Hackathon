import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['consumer', 'vendor']).default('consumer'),
  businessName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const addressSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(4, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  isDefault: z.boolean().optional(),
});

export const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  categoryName: z.string().optional(),
  brand: z.string().min(1, 'Brand is required'),
  sku: z.string().min(2, 'SKU is required'),
  price: z.number().positive('Price must be greater than zero'),
  discount: z.number().min(0).max(100).default(0),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  images: z.array(z.string().url()).min(1, 'At least one image is required'),
  specifications: z.record(z.string()).default({}),
  shippingPolicy: z.string().default('Standard delivery in 3-5 business days.'),
  returnPolicy: z.string().default('7-day replacement or return window.'),
  status: z.enum(['active', 'draft', 'archived']).default('active'),
});

export const orderStatusTransitionSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'rejected',
    'return_requested',
    'returned',
    'refund_pending',
    'refunded',
  ]),
  notes: z.string().optional(),
  trackingNumber: z.string().optional(),
  shippingCarrier: z.string().optional(),
});

export const createCheckoutOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      vendorId: z.string(),
      quantity: z.number().int().positive(),
      selectedVariant: z.record(z.string()).optional(),
    })
  ).min(1, 'Cart cannot be empty'),
  address: addressSchema,
  paymentMethod: z.enum(['razorpay', 'cash_on_delivery', 'card_test']),
  couponCode: z.string().optional(),
});

export const aiAgentConfigSchema = z.object({
  enabled: z.boolean(),
  agentName: z.string().min(2),
  avatarUrl: z.string().optional(),
  greetingMessage: z.string().min(5),
  personality: z.enum(['friendly', 'professional', 'concise', 'technical']),
  supportedLanguages: z.array(z.string()).min(1),
  businessHours: z.object({
    enabled: z.boolean(),
    start: z.string(),
    end: z.string(),
    timezone: z.string(),
  }),
  responseStyle: z.enum(['concise', 'detailed', 'friendly', 'professional']),
  faqs: z.array(
    z.object({
      question: z.string().min(3),
      answer: z.string().min(3),
    })
  ),
  shippingPolicy: z.string(),
  returnPolicy: z.string(),
  warrantyInfo: z.string(),
  escalationRules: z.array(z.string()),
  humanTakeoverActive: z.boolean(),
});

export const supportTicketSchema = z.object({
  subject: z.string().min(5, 'Subject is required'),
  category: z.string().min(2, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  orderId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});
