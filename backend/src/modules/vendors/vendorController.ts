import { Response } from 'express';
import { db } from '../../services/dataStore';
import { AuthenticatedRequest } from '../../middleware/auth';
import { VendorOverviewStats } from '../../../../shared';

export class VendorController {
  private resolveVendorId(paramVendorId: string, req: AuthenticatedRequest): string {
    if (paramVendorId === 'me' && req.user) {
      const myVendor = db.findVendorByOwnerUid(req.user.uid);
      return myVendor?.vendorId || req.user.vendorId || '';
    }
    return paramVendorId;
  }

  public listVendors(_req: AuthenticatedRequest, res: Response) {
    res.json(db.getVendors());
  }

  public getVendorById(req: AuthenticatedRequest, res: Response) {
    const vendorId = this.resolveVendorId(req.params.vendorId, req);
    const vendor = db.findVendorById(vendorId);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json(vendor);
  }

  public getVendorProducts(req: AuthenticatedRequest, res: Response) {
    const vendorId = this.resolveVendorId(req.params.vendorId, req);
    const { status } = req.query;
    const products = db.getProducts({
      vendorId,
      status: status as string,
    });
    res.json(products);
  }

  public getVendorStatistics(req: AuthenticatedRequest, res: Response) {
    const vendorId = this.resolveVendorId(req.params.vendorId, req);
    const timeframe = (req.query.timeframe as string) || 'weekly';
    const vendor = db.findVendorById(vendorId);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Authorization check
    if (req.user && req.user.role === 'vendor') {
      const myVendor = db.findVendorByOwnerUid(req.user.uid);
      if (!myVendor || myVendor.vendorId !== vendorId) {
        return res.status(403).json({ error: 'Unauthorized to view this vendor statistics' });
      }
    }

    const allVendorOrders = db.getOrders({ vendorId });
    const allVendorProducts = db.getProducts({ vendorId, status: undefined });
    const activeProducts = allVendorProducts.filter((p) => p.status === 'active');

    let totalRevenue = 0;
    let pendingOrders = 0;
    let completedOrders = 0;
    const customerOrderCounts: Record<string, number> = {};

    for (const order of allVendorOrders) {
      if (['confirmed', 'processing', 'shipped', 'delivered'].includes(order.orderStatus)) {
        totalRevenue += order.total;
      }
      if (['pending', 'confirmed', 'processing'].includes(order.orderStatus)) {
        pendingOrders += 1;
      }
      if (order.orderStatus === 'delivered') {
        completedOrders += 1;
      }
      customerOrderCounts[order.consumerId] = (customerOrderCounts[order.consumerId] || 0) + 1;
    }

    const uniqueCustomerIds = Object.keys(customerOrderCounts);
    const totalOrders = allVendorOrders.length;
    const averageOrderValue = totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0;

    // Dynamic conversation, AI, translation, and response-time telemetry
    const vendorConversations = db.getAllConversations().filter((c) => c.vendorId === vendorId);
    const unreadConversations = vendorConversations.reduce(
      (acc, conv) => acc + (conv.unreadCount[vendor.ownerUid] || conv.unreadCount[vendorId] || 0),
      0
    );

    const escalatedConversations = vendorConversations.filter(
      (c) => c.status === 'escalated' || c.escalatedToSupport
    ).length;

    let totalMessages = 0;
    let aiMessages = 0;
    let translatedMessagesCount = 0;
    const responseDeltasSec: number[] = [];

    for (const conv of vendorConversations) {
      const msgs = db.getMessages(conv.conversationId);
      totalMessages += msgs.length;
      for (let i = 0; i < msgs.length; i++) {
        const m = msgs[i];
        if (m.isAiGenerated) aiMessages += 1;
        if (Object.keys(m.metadata?.translatedText || {}).length > 1) {
          translatedMessagesCount += 1;
        }
        if (i > 0 && msgs[i - 1].senderRole === 'consumer' && m.senderRole !== 'consumer') {
          const deltaSec = Math.max(
            1,
            Math.round((new Date(m.createdAt).getTime() - new Date(msgs[i - 1].createdAt).getTime()) / 1000)
          );
          if (deltaSec < 86400) {
            responseDeltasSec.push(deltaSec);
          }
        }
      }
    }

    const avgResponseTimeSeconds =
      responseDeltasSec.length > 0
        ? Math.round(responseDeltasSec.reduce((a, b) => a + b, 0) / responseDeltasSec.length)
        : 0;

    const chatToSaleConversionRate =
      vendorConversations.length > 0
        ? Number(Math.min(100, (totalOrders / vendorConversations.length) * 100).toFixed(1))
        : 0;

    const repeatCustomers = Object.values(customerOrderCounts).filter((cnt) => cnt > 1).length;
    const customerRetentionRate =
      uniqueCustomerIds.length > 0
        ? Number(
            ((repeatCustomers > 0 ? repeatCustomers / uniqueCustomerIds.length : totalOrders > 0 ? 1 : 0) * 100).toFixed(1)
          )
        : 0;

    const aiResolutionRate =
      vendorConversations.length > 0
        ? Number(
            (
              ((vendorConversations.length - escalatedConversations) / vendorConversations.length) *
              100
            ).toFixed(1)
          )
        : aiMessages > 0
        ? 100
        : 0;

    // Calculate growth by comparing last 7 days vs prior period orders
    const nowMs = Date.now();
    const sevenDaysMs = 7 * 86400000;
    const recentRev = allVendorOrders
      .filter((o) => nowMs - new Date(o.createdAt).getTime() <= sevenDaysMs)
      .reduce((sum, o) => sum + o.total, 0);
    const priorRev = allVendorOrders
      .filter((o) => {
        const age = nowMs - new Date(o.createdAt).getTime();
        return age > sevenDaysMs && age <= sevenDaysMs * 2;
      })
      .reduce((sum, o) => sum + o.total, 0);

    const salesGrowthPercentage =
      priorRev > 0
        ? Number((((recentRev - priorRev) / priorRev) * 100).toFixed(1))
        : recentRev > 0
        ? 100
        : 0;

    const stats: VendorOverviewStats = {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders,
      totalProducts: allVendorProducts.length,
      activeProducts: activeProducts.length,
      pendingOrders,
      completedOrders,
      newCustomers: uniqueCustomerIds.length,
      unreadConversations,
      averageOrderValue,
      salesGrowthPercentage,
      avgResponseTimeSeconds,
      chatToSaleConversionRate,
      customerRetentionRate,
      aiResolutionRate,
      escalatedConversations,
      translatedMessagesCount,
    };

    // Build dynamic time-series chartData from real orders
    const chartData: Array<{ day: string; revenue: number; orders: number }> = [];
    if (timeframe === 'daily') {
      // Last 24h grouped in 4-hour intervals
      for (let slot = 5; slot >= 0; slot--) {
        const end = new Date(nowMs - slot * 4 * 3600000);
        const start = new Date(end.getTime() - 4 * 3600000);
        const label = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const slotOrders = allVendorOrders.filter((o) => {
          const t = new Date(o.createdAt).getTime();
          return t > start.getTime() && t <= end.getTime();
        });
        chartData.push({
          day: label,
          revenue: Number(slotOrders.reduce((s, o) => s + o.total, 0).toFixed(2)),
          orders: slotOrders.length,
        });
      }
    } else if (timeframe === 'monthly') {
      // Last 4 weeks
      for (let w = 3; w >= 0; w--) {
        const end = nowMs - w * 7 * 86400000;
        const start = end - 7 * 86400000;
        const label = `Wk ${4 - w}`;
        const weekOrders = allVendorOrders.filter((o) => {
          const t = new Date(o.createdAt).getTime();
          return t > start && t <= end;
        });
        chartData.push({
          day: label,
          revenue: Number(weekOrders.reduce((s, o) => s + o.total, 0).toFixed(2)),
          orders: weekOrders.length,
        });
      }
    } else {
      // Weekly: last 7 calendar days
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let d = 6; d >= 0; d--) {
        const dateObj = new Date(nowMs - d * 86400000);
        const dateKey = dateObj.toISOString().slice(0, 10);
        const dayOrders = allVendorOrders.filter((o) => o.createdAt.slice(0, 10) === dateKey);
        chartData.push({
          day: dayNames[dateObj.getDay()],
          revenue: Number(dayOrders.reduce((s, o) => s + o.total, 0).toFixed(2)),
          orders: dayOrders.length,
        });
      }
    }

    res.json({
      overview: stats,
      chartData,
      recentOrders: allVendorOrders.slice(0, 5),
      timeframe,
      totalMessages,
    });
  }

  public getVendorCustomers(req: AuthenticatedRequest, res: Response) {
    const vendorId = this.resolveVendorId(req.params.vendorId, req);
    const vendor = db.findVendorById(vendorId);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const orders = db.getOrders({ vendorId });
    const convs = db.getAllConversations().filter((c) => c.vendorId === vendorId);

    const customerMap: Record<
      string,
      {
        uid: string;
        firebaseUid?: string;
        name: string;
        email: string;
        phoneNumber?: string;
        photoURL?: string;
        preferredLanguage: string;
        authProvider?: string;
        createdAt?: string;
        shippingAddress?: {
          street?: string;
          city?: string;
          state?: string;
          postalCode?: string;
          country?: string;
          phone?: string;
        };
        totalOrders: number;
        totalSpent: number;
        lastOrderDate: string;
        activeConversationId?: string;
        lastMessageText?: string;
        recentOrders: Array<{
          orderId: string;
          total: number;
          orderStatus: string;
          paymentStatus: string;
          createdAt: string;
          itemsCount: number;
          trackingNumber?: string;
        }>;
      }
    > = {};

    const ensureRecord = (consumerId: string, fallbackName: string, fallbackEmail: string, fallbackLang: string, fallbackDate: string) => {
      if (customerMap[consumerId]) return customerMap[consumerId];
      const user = db.findUserById(consumerId);
      const savedAddr = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];
      customerMap[consumerId] = {
        uid: consumerId,
        firebaseUid: user?.firebaseUid,
        name: user?.displayName || fallbackName || 'Verified Buyer',
        email: user?.email || fallbackEmail || 'Not provided',
        phoneNumber: user?.phoneNumber || savedAddr?.phone,
        photoURL: user?.photoURL,
        preferredLanguage: user?.preferredLanguage || fallbackLang || 'en',
        authProvider: user?.authProvider || 'firebase',
        createdAt: user?.createdAt,
        shippingAddress: savedAddr
          ? {
              street: savedAddr.street,
              city: savedAddr.city,
              state: savedAddr.state,
              postalCode: savedAddr.postalCode,
              country: savedAddr.country,
              phone: savedAddr.phone,
            }
          : undefined,
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: fallbackDate,
        recentOrders: [],
      };
      return customerMap[consumerId];
    };

    for (const order of orders) {
      const rec = ensureRecord(
        order.consumerId,
        order.consumerName || 'Verified Buyer',
        order.consumerEmail || '',
        'en',
        order.createdAt
      );
      rec.totalOrders += 1;
      rec.totalSpent = Number((rec.totalSpent + order.total).toFixed(2));
      if (!rec.shippingAddress && order.addressSnapshot) {
        rec.shippingAddress = {
          street: order.addressSnapshot.street,
          city: order.addressSnapshot.city,
          state: order.addressSnapshot.state,
          postalCode: order.addressSnapshot.postalCode,
          country: order.addressSnapshot.country,
          phone: order.addressSnapshot.phone,
        };
      }
      if (!rec.phoneNumber && order.addressSnapshot?.phone) {
        rec.phoneNumber = order.addressSnapshot.phone;
      }
      if (new Date(order.createdAt) > new Date(rec.lastOrderDate)) {
        rec.lastOrderDate = order.createdAt;
      }
      rec.recentOrders.push({
        orderId: order.orderId,
        total: order.total,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        itemsCount: order.items.reduce((s, it) => s + it.quantity, 0),
        trackingNumber: order.trackingNumber,
      });
    }

    for (const conv of convs) {
      const rec = ensureRecord(
        conv.consumerId,
        conv.consumerName,
        conv.consumerEmail || '',
        conv.consumerPreferredLanguage || 'en',
        conv.updatedAt
      );
      if (!rec.activeConversationId) {
        rec.activeConversationId = conv.conversationId;
        rec.lastMessageText = conv.lastMessage?.text;
      }
      if (new Date(conv.updatedAt) > new Date(rec.lastOrderDate)) {
        rec.lastOrderDate = conv.updatedAt;
      }
    }

    res.json(
      Object.values(customerMap).sort(
        (a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
      )
    );
  }

  public updateVendor(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const vendorId = this.resolveVendorId(req.params.vendorId, req);
    const vendor = db.findVendorById(vendorId);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    if (req.user.role === 'vendor' && vendor.ownerUid !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized to modify this vendor' });
    }

    const updated = db.updateVendor(vendorId, req.body);
    res.json(updated);
  }
}

export const vendorController = new VendorController();
