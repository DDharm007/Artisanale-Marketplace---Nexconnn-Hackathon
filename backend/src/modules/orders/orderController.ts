import { Response } from 'express';
import { db } from '../../services/dataStore';
import { AuthenticatedRequest } from '../../middleware/auth';
import {
  Order,
  OrderItem,
  OrderStatus,
  ORDER_STATUS_FLOW,
  DEFAULT_TAX_RATE,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
} from '../../../../shared';

export class OrderController {
  public createOrder(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { items, address, paymentMethod, couponCode } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one product item' });
    }

    if (!address || !address.street || !address.city || !address.postalCode) {
      return res.status(400).json({ error: 'Valid shipping address is required' });
    }

    // 1. Group items by vendorId for multi-vendor checkout
    const itemsByVendor: Record<string, typeof items> = {};
    for (const item of items) {
      if (!itemsByVendor[item.vendorId]) {
        itemsByVendor[item.vendorId] = [];
      }
      itemsByVendor[item.vendorId].push(item);
    }

    const checkoutGroupId = `chk_grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const createdOrders: Order[] = [];

    // Coupon discount logic
    let couponDiscountPercentage = 0;
    if (couponCode && couponCode.toUpperCase() === 'CONVO10') {
      couponDiscountPercentage = 0.10; // 10% coupon discount
    }

    for (const [vendorId, vendorItems] of Object.entries(itemsByVendor)) {
      const vendor = db.findVendorById(vendorId);
      let subtotal = 0;
      const verifiedOrderItems: OrderItem[] = [];

      for (const item of vendorItems) {
        const product = db.findProductById(item.productId);
        if (!product) {
          return res.status(400).json({ error: `Product with ID ${item.productId} not found` });
        }
        if (product.stock < item.quantity) {
          return res.status(400).json({
            error: `Insufficient stock for "${product.title}". Requested: ${item.quantity}, Available: ${product.stock}`,
          });
        }

        // Recalculate price authoritative from database
        const effectivePrice = product.discount > 0
          ? Number((product.price * (1 - product.discount / 100)).toFixed(2))
          : product.price;

        subtotal += effectivePrice * item.quantity;

        // Decrement product inventory
        db.updateProduct(product.productId, {
          stock: product.stock - item.quantity,
        });

        verifiedOrderItems.push({
          productId: product.productId,
          vendorId: product.vendorId,
          title: product.title,
          price: effectivePrice,
          discount: product.discount,
          quantity: item.quantity,
          selectedVariant: item.selectedVariant,
          image: product.images[0],
        });
      }

      const discount = Number((subtotal * couponDiscountPercentage).toFixed(2));
      const taxableAmount = Math.max(0, subtotal - discount);
      const tax = Number((taxableAmount * DEFAULT_TAX_RATE).toFixed(2));
      const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
      const total = Number((taxableAmount + tax + shipping).toFixed(2));

      const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const order: Order = {
        orderId,
        checkoutGroupId,
        consumerId: req.user.uid,
        consumerName: req.user.displayName,
        consumerEmail: req.user.email,
        vendorId,
        vendorName: vendor ? vendor.businessName : 'Verified Vendor',
        items: verifiedOrderItems,
        subtotal: Number(subtotal.toFixed(2)),
        shipping,
        discount,
        tax,
        total,
        paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'authorized',
        orderStatus: 'confirmed',
        shippingStatus: 'Order confirmed and ready for packaging',
        addressSnapshot: address,
        paymentMethod,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.addOrder(order);
      createdOrders.push(order);
    }

    // Clear consumer cart after successful checkout
    db.saveCart({
      cartId: `cart_${req.user.uid}`,
      consumerId: req.user.uid,
      items: [],
      updatedAt: new Date().toISOString(),
    });

    res.status(201).json({
      message: 'Orders placed successfully',
      checkoutGroupId,
      orders: createdOrders,
      totalOrdersPlaced: createdOrders.length,
    });
  }

  public getOrders(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let orders: Order[] = [];
    if (req.user.role === 'consumer') {
      orders = db.getOrders({ consumerId: req.user.uid });
    } else if (req.user.role === 'vendor') {
      const vendor = db.findVendorByOwnerUid(req.user.uid);
      if (vendor) {
        orders = db.getOrders({ vendorId: vendor.vendorId });
      }
    } else if (req.user.role === 'support_agent' || req.user.role === 'admin') {
      orders = db.getOrders();
    }

    res.json(orders);
  }

  public getOrderById(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { orderId } = req.params;
    const order = db.findOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Authorization check
    if (req.user.role === 'consumer' && order.consumerId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied to this order' });
    }

    if (req.user.role === 'vendor') {
      const vendor = db.findVendorByOwnerUid(req.user.uid);
      if (!vendor || vendor.vendorId !== order.vendorId) {
        return res.status(403).json({ error: 'Access denied to this order' });
      }
    }

    res.json(order);
  }

  public updateOrderStatus(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { orderId } = req.params;
    const { status, notes, trackingNumber, shippingCarrier } = req.body;

    const order = db.findOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Role check
    if (req.user.role === 'vendor') {
      const vendor = db.findVendorByOwnerUid(req.user.uid);
      if (!vendor || vendor.vendorId !== order.vendorId) {
        return res.status(403).json({ error: 'You do not own this order' });
      }
    } else if (req.user.role !== 'admin' && req.user.role !== 'support_agent') {
      return res.status(403).json({ error: 'Insufficient permissions to update order status' });
    }

    // State machine check
    const allowedNextStatuses = ORDER_STATUS_FLOW[order.orderStatus as OrderStatus];
    if (!allowedNextStatuses || !allowedNextStatuses.includes(status as OrderStatus)) {
      return res.status(400).json({
        error: `Invalid status transition from "${order.orderStatus}" to "${status}". Allowed transitions: [${allowedNextStatuses?.join(', ') || 'None'}]`,
      });
    }

    let shippingStatus = order.shippingStatus;
    if (status === 'processing') shippingStatus = 'Being packed at fulfillment center';
    if (status === 'shipped') shippingStatus = `Shipped via ${shippingCarrier || 'Carrier'}. Tracking: ${trackingNumber || 'Available shortly'}`;
    if (status === 'delivered') shippingStatus = 'Delivered to customer address';

    const updated = db.updateOrder(orderId, {
      orderStatus: status,
      shippingStatus,
      trackingNumber: trackingNumber ?? order.trackingNumber,
      shippingCarrier: shippingCarrier ?? order.shippingCarrier,
      notes: notes ?? order.notes,
    });

    res.json({ message: 'Order status updated', order: updated });
  }

  public cancelOrder(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { orderId } = req.params;
    const { reason } = req.body;

    const order = db.findOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.consumerId !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You cannot cancel this order' });
    }

    if (['shipped', 'delivered', 'cancelled', 'refunded'].includes(order.orderStatus)) {
      return res.status(400).json({ error: `Cannot cancel order in status: ${order.orderStatus}` });
    }

    // Restock items
    for (const item of order.items) {
      const p = db.findProductById(item.productId);
      if (p) {
        db.updateProduct(p.productId, { stock: p.stock + item.quantity });
      }
    }

    const updated = db.updateOrder(orderId, {
      orderStatus: 'cancelled',
      cancellationReason: reason || 'Customer requested cancellation',
      paymentStatus: order.paymentStatus === 'captured' ? 'refunded' : 'failed',
      shippingStatus: 'Cancelled',
    });

    res.json({ message: 'Order cancelled successfully', order: updated });
  }

  public requestReturn(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { orderId } = req.params;
    const { reason } = req.body;

    const order = db.findOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.consumerId !== req.user.uid) {
      return res.status(403).json({ error: 'You cannot request return for this order' });
    }

    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({ error: 'Only delivered orders are eligible for return' });
    }

    const updated = db.updateOrder(orderId, {
      orderStatus: 'return_requested',
      returnReason: reason || 'Return requested by buyer',
      shippingStatus: 'Return pickup requested',
    });

    res.json({ message: 'Return request submitted', order: updated });
  }
}

export const orderController = new OrderController();
