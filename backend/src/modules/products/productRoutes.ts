import { Router } from 'express';
import { productController } from './productController';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validator';
import { productSchema } from '../../../../shared';

const router = Router();

router.get('/categories', (req, res) => productController.getCategories(req, res));
router.get('/', (req, res) => productController.getProducts(req, res));
router.get('/:productId', (req, res) => productController.getProductById(req, res));

router.post(
  '/',
  authenticate,
  requireRole(['vendor', 'admin']),
  validateBody(productSchema),
  (req, res) => productController.createProduct(req, res)
);

router.patch('/:productId', authenticate, requireRole(['vendor', 'admin']), (req, res) =>
  productController.updateProduct(req, res)
);

router.delete('/:productId', authenticate, requireRole(['vendor', 'admin']), (req, res) =>
  productController.deleteProduct(req, res)
);

export default router;
