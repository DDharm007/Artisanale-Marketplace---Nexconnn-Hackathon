import { Response } from 'express';
import { db } from '../../services/dataStore';
import { AuthenticatedRequest } from '../../middleware/auth';

export class AdminController {
  public getOverviewStats(req: AuthenticatedRequest, res: Response) {
    const users = db.getUsers();
    const vendors = db.getVendors();
    const products = db.getProducts({ status: undefined });
    const orders = db.getOrders();
    const tickets = db.getSupportTickets();

    let totalGMV = 0;
    let totalCommissions = 0;

    for (const order of orders) {
      if (['confirmed', 'processing', 'shipped', 'delivered'].includes(order.orderStatus)) {
        totalGMV += order.total;
        totalCommissions += order.total * 0.05; // 5% marketplace take rate
      }
    }

    res.json({
      totalUsers: users.length,
      totalVendors: vendors.length,
      totalProducts: products.length,
      totalOrders: orders.length,
      totalGMV: Number(totalGMV.toFixed(2)),
      totalCommissions: Number(totalCommissions.toFixed(2)),
      pendingTickets: tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length,
      recentUsers: users.slice(-5),
      recentOrders: orders.slice(0, 5),
    });
  }

  public getUsers(req: AuthenticatedRequest, res: Response) {
    const users = db.getUsers();
    res.json(users);
  }

  public getVendors(req: AuthenticatedRequest, res: Response) {
    const vendors = db.getVendors();
    res.json(vendors);
  }

  public updateVendorVerification(req: AuthenticatedRequest, res: Response) {
    const { vendorId } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be pending, approved, or rejected' });
    }

    const updated = db.updateVendor(vendorId, { verificationStatus: status });
    if (!updated) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ message: `Vendor verification updated to ${status}`, vendor: updated });
  }

  public updateProductModeration(req: AuthenticatedRequest, res: Response) {
    const { productId } = req.params;
    const { status } = req.body;

    if (!['active', 'draft', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid product status' });
    }

    const updated = db.updateProduct(productId, { status });
    if (!updated) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: `Product moderation status set to ${status}`, product: updated });
  }
}

export const adminController = new AdminController();
