import { Router } from 'express';
import { supportController } from './supportController';
import { authenticate, optionalAuthenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validator';
import { supportTicketSchema } from '../../../../shared';

const router = Router();

router.get('/knowledge-base', optionalAuthenticate, (req, res) =>
  supportController.getKnowledgeBase(req, res)
);
router.post('/faqs/:faqId/vote', optionalAuthenticate, (req, res) =>
  supportController.voteFAQ(req, res)
);
router.post('/faqs', authenticate, requireRole(['support_agent', 'admin']), (req, res) =>
  supportController.createFAQ(req, res)
);
router.put('/faqs/:faqId', authenticate, requireRole(['support_agent', 'admin']), (req, res) =>
  supportController.updateFAQ(req, res)
);
router.delete('/faqs/:faqId', authenticate, requireRole(['support_agent', 'admin']), (req, res) =>
  supportController.deleteFAQ(req, res)
);

router.post('/articles', authenticate, requireRole(['support_agent', 'admin']), (req, res) =>
  supportController.createArticle(req, res)
);
router.put('/articles/:articleId', authenticate, requireRole(['support_agent', 'admin']), (req, res) =>
  supportController.updateArticle(req, res)
);
router.delete('/articles/:articleId', authenticate, requireRole(['support_agent', 'admin']), (req, res) =>
  supportController.deleteArticle(req, res)
);

router.get('/dispatch-overview', authenticate, (req, res) => supportController.getDispatchOverview(req, res));
router.get('/tickets', authenticate, (req, res) => supportController.getTickets(req, res));
router.get('/tickets/:ticketId', authenticate, (req, res) => supportController.getTicketById(req, res));
router.post('/tickets', authenticate, validateBody(supportTicketSchema), (req, res) =>
  supportController.createTicket(req, res)
);

router.post('/tickets/:ticketId/replies', authenticate, (req, res) =>
  supportController.addTicketReply(req, res)
);
router.patch('/tickets/:ticketId/replies/:replyId', authenticate, (req, res) =>
  supportController.updateTicketReply(req, res)
);

router.patch(
  '/tickets/:ticketId',
  authenticate,
  requireRole(['support_agent', 'admin']),
  (req, res) => supportController.updateTicket(req, res)
);
router.delete(
  '/tickets/:ticketId',
  authenticate,
  requireRole(['support_agent', 'admin']),
  (req, res) => supportController.deleteTicket(req, res)
);

router.post(
  '/tickets/:ticketId/notes',
  authenticate,
  requireRole(['support_agent', 'admin']),
  (req, res) => supportController.addInternalNote(req, res)
);

export default router;
