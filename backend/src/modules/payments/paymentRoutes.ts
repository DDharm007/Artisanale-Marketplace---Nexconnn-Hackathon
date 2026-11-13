import { Router } from 'express';
import { paymentController } from './paymentController';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/create-order', authenticate, (req, res) =>
  paymentController.createPaymentOrder(req, res)
);

router.post('/verify', authenticate, (req, res) =>
  paymentController.verifyPayment(req, res)
);

router.post('/webhook', (req, res) =>
  paymentController.handleWebhook(req, res)
);

router.post('/refund', authenticate, (req, res) =>
  paymentController.processRefund(req, res)
);

export default router;
