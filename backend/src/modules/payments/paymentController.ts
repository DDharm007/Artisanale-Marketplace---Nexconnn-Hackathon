import { Request, Response } from 'express';
import { razorpayService } from '../../services/razorpayService';
import { db } from '../../services/dataStore';
import { AuthenticatedRequest } from '../../middleware/auth';

export class PaymentController {
  public async createPaymentOrder(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { orderId, amount, currency = 'USD' } = req.body;
    if (!orderId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid orderId and positive amount are required' });
    }

    try {
      const razorpayOrder = await razorpayService.createOrder(orderId, amount, currency);
      res.json(razorpayOrder);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error initiating payment order' });
    }
  }

  public async verifyPayment(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!orderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: 'Missing required payment verification parameters' });
    }

    const isValid = razorpayService.verifySignature(
      razorpayOrderId || orderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      return res.status(400).json({
        verified: false,
        error: 'Invalid payment signature. Potential tampering detected.',
      });
    }

    // Update payment record in database
    const payment = db.findPaymentByOrderId(orderId);
    if (payment) {
      db.updatePayment(payment.paymentId, {
        status: 'captured',
        providerPaymentId: razorpayPaymentId,
        signature: razorpaySignature,
      });
    }

    // Update order status
    const order = db.findOrderById(orderId);
    if (order) {
      db.updateOrder(orderId, {
        paymentStatus: 'captured',
        orderStatus: order.orderStatus === 'pending' ? 'confirmed' : order.orderStatus,
      });
    }

    res.json({
      verified: true,
      message: 'Payment verified successfully and transaction captured.',
      paymentId: razorpayPaymentId,
      orderId,
    });
  }

  public handleWebhook(req: Request, res: Response) {
    const signature = req.headers['x-razorpay-signature'] as string;
    const bodyStr = JSON.stringify(req.body);

    const isAuthentic = razorpayService.verifyWebhook(bodyStr, signature);
    if (!isAuthentic && process.env.NODE_ENV === 'production') {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    console.log('[Razorpay Webhook Event Received]:', event);

    if (event === 'payment.captured') {
      const paymentEntity = req.body.payload?.payment?.entity;
      const orderId = paymentEntity?.notes?.orderId;
      if (orderId) {
        db.updateOrder(orderId, { paymentStatus: 'captured' });
      }
    }

    res.json({ status: 'ok' });
  }

  public async processRefund(req: AuthenticatedRequest, res: Response) {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'vendor')) {
      return res.status(403).json({ error: 'Unauthorized to trigger refunds' });
    }

    const { paymentId, amount, reason } = req.body;
    try {
      const refund = await razorpayService.processRefund(paymentId, amount, reason || 'Requested by vendor');
      res.json(refund);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}

export const paymentController = new PaymentController();
