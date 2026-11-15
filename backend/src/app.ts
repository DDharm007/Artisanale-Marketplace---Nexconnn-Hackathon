import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { firebaseService } from './services/firebaseService';

import authRoutes from './modules/auth/authRoutes';
import productRoutes from './modules/products/productRoutes';
import vendorRoutes from './modules/vendors/vendorRoutes';
import orderRoutes from './modules/orders/orderRoutes';
import cartRoutes from './modules/carts/cartRoutes';
import conversationRoutes from './modules/conversations/conversationRoutes';
import aiAgentRoutes from './modules/ai-agent/aiAgentRoutes';
import supportRoutes from './modules/support/supportRoutes';
import adminRoutes from './modules/admin/adminRoutes';
import paymentRoutes from './modules/payments/paymentRoutes';

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    product: 'ConvoCart Multi-Vendor Marketplace',
    nexconnConfigured: true,
    nexconnCallSdk: true,
    firebase: firebaseService.getStatus(),
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/ai-agent', aiAgentRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// Centralized error handling
app.use(errorHandler);
