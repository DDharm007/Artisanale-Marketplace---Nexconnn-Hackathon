import { Router } from 'express';
import { vendorController } from './vendorController';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.get('/:vendorId', (req, res) => vendorController.getVendorById(req, res));
router.get('/:vendorId/products', (req, res) => vendorController.getVendorProducts(req, res));
router.get('/:vendorId/statistics', authenticate, (req, res) => vendorController.getVendorStatistics(req, res));
router.get('/:vendorId/customers', authenticate, (req, res) => vendorController.getVendorCustomers(req, res));
router.patch('/:vendorId', authenticate, requireRole(['vendor', 'admin']), (req, res) =>
  vendorController.updateVendor(req, res)
);

export default router;
