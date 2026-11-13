import { Router } from 'express';
import { supportController } from './supportController';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validator';
import { supportTicketSchema } from '../../../../shared';

const router = Router();

router.get('/tickets', authenticate, (req, res) => supportController.getTickets(req, res));
router.get('/tickets/:ticketId', authenticate, (req, res) => supportController.getTicketById(req, res));
router.post('/tickets', authenticate, validateBody(supportTicketSchema), (req, res) =>
  supportController.createTicket(req, res)
);

router.patch(
  '/tickets/:ticketId',
  authenticate,
  requireRole(['support_agent', 'admin']),
  (req, res) => supportController.updateTicket(req, res)
);

router.post(
  '/tickets/:ticketId/notes',
  authenticate,
  requireRole(['support_agent', 'admin']),
  (req, res) => supportController.addInternalNote(req, res)
);

export default router;
