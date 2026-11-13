import { Router } from 'express';
import { orderController } from './orderController';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validator';
import { createCheckoutOrderSchema, orderStatusTransitionSchema } from '../../../../shared';

const router = Router();

router.post('/', authenticate, validateBody(createCheckoutOrderSchema), (req, res) =>
  orderController.createOrder(req, res)
);

router.get('/', authenticate, (req, res) => orderController.getOrders(req, res));
router.get('/:orderId', authenticate, (req, res) => orderController.getOrderById(req, res));

router.patch(
  '/:orderId/status',
  authenticate,
  requireRole(['vendor', 'admin', 'support_agent']),
  validateBody(orderStatusTransitionSchema),
  (req, res) => orderController.updateOrderStatus(req, res)
);

router.post('/:orderId/cancel', authenticate, (req, res) => orderController.cancelOrder(req, res));
router.post('/:orderId/return', authenticate, (req, res) => orderController.requestReturn(req, res));

export default router;
