import { Router } from 'express';
import { aiAgentController } from './aiAgentController';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validator';
import { aiAgentConfigSchema } from '../../../../shared';

const router = Router();

router.get('/config', authenticate, requireRole(['vendor', 'admin']), (req, res) =>
  aiAgentController.getConfig(req, res)
);

router.patch(
  '/config',
  authenticate,
  requireRole(['vendor', 'admin']),
  validateBody(aiAgentConfigSchema),
  (req, res) => aiAgentController.updateConfig(req, res)
);

router.post('/takeover', authenticate, requireRole(['vendor', 'admin']), (req, res) =>
  aiAgentController.takeover(req, res)
);

router.post('/respond', authenticate, requireRole(['vendor', 'admin']), (req, res, next) => {
  aiAgentController.previewResponse(req, res).catch(next);
});

export default router;
