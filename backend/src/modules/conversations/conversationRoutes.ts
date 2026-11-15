import { Router } from 'express';
import { conversationController } from './conversationController';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, (req, res) => conversationController.getConversations(req, res));
router.post('/', authenticate, (req, res) => conversationController.startConversation(req, res));
router.post('/translate-text', authenticate, (req, res, next) => {
  conversationController.translateDraftText(req, res).catch(next);
});
router.get('/:conversationId', authenticate, (req, res) => conversationController.getConversationById(req, res));
router.get('/:conversationId/messages', authenticate, (req, res) => conversationController.getMessages(req, res));
router.post('/:conversationId/messages', authenticate, (req, res, next) => {
  conversationController.sendMessage(req, res).catch(next);
});
router.patch('/:conversationId/messages/:messageId', authenticate, (req, res, next) => {
  conversationController.editMessage(req, res).catch(next);
});
router.delete('/:conversationId/messages/:messageId', authenticate, (req, res) =>
  conversationController.deleteMessage(req, res)
);
router.post('/:conversationId/messages/:messageId/translate', authenticate, (req, res, next) => {
  conversationController.translateMessage(req, res).catch(next);
});
router.post('/:conversationId/translate-all', authenticate, (req, res, next) => {
  conversationController.translateAllMessages(req, res).catch(next);
});
router.post('/:conversationId/escalate', authenticate, (req, res, next) => {
  conversationController.escalateConversation(req, res).catch(next);
});
router.post('/:conversationId/dispatch', authenticate, (req, res) =>
  conversationController.dispatchConversation(req, res)
);
router.patch('/:conversationId/settings', authenticate, (req, res, next) => {
  conversationController.updateConversationSettings(req, res).catch(next);
});
router.patch('/:conversationId/read', authenticate, (req, res) => conversationController.markAsRead(req, res));
router.post('/:conversationId/call-token', authenticate, (req, res) => conversationController.getCallToken(req, res));

export default router;
