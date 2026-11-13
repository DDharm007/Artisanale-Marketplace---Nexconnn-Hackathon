import { Router } from 'express';
import { cartController } from './cartController';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, (req, res) => cartController.getCart(req, res));
router.post('/items', authenticate, (req, res) => cartController.addItem(req, res));
router.patch('/items/:productId', authenticate, (req, res) => cartController.updateItemQuantity(req, res));
router.delete('/items/:productId', authenticate, (req, res) => cartController.removeItem(req, res));
router.delete('/', authenticate, (req, res) => cartController.clearCart(req, res));

export default router;
