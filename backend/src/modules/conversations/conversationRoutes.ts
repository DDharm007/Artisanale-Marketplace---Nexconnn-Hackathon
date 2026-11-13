import { Router } from 'express';
import { conversationController } from './conversationController';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, (req, res) => conversationController.getConversations(req, res));
router.post('/', authenticate, (req, res) => conversationController.startConversation(req, res));
router.get('/:conversationId', authenticate, (req, res) => conversationController.getConversationById(req, res));
router.get('/:conversationId/messages', authenticate, (req, res) => conversationController.getMessages(req, res));
router.post('/:conversationId/messages', authenticate, (req, res, next) => {
  conversationController.sendMessage(req, res).catch(next);
});
router.patch('/:conversationId/read', authenticate, (req, res) => conversationController.markAsRead(req, res));
router.post('/:conversationId/call-token', authenticate, (req, res) => conversationController.getCallToken(req, res));

export default router;
