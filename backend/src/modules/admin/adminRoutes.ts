import { Router } from 'express';
import { adminController } from './adminController';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

// Enforce admin permission for all admin routes
router.use(authenticate, requireRole(['admin']));

router.get('/overview', (req, res) => adminController.getOverviewStats(req, res));
router.get('/users', (req, res) => adminController.getUsers(req, res));
router.get('/vendors', (req, res) => adminController.getVendors(req, res));
router.patch('/vendors/:vendorId/verification', (req, res) =>
  adminController.updateVendorVerification(req, res)
);
router.patch('/products/:productId/moderation', (req, res) =>
  adminController.updateProductModeration(req, res)
);

export default router;
