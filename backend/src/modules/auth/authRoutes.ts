import { Router } from 'express';
import { authController } from './authController';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validator';
import { registerSchema, loginSchema } from '../../../../shared';

const router = Router();

router.post('/register', validateBody(registerSchema), (req, res, next) => {
  authController.register(req, res).catch(next);
});

router.post('/login', validateBody(loginSchema), (req, res, next) => {
  authController.login(req, res).catch(next);
});

router.get('/me', authenticate, (req, res, next) => {
  authController.getMe(req, res).catch(next);
});

router.patch('/profile', authenticate, (req, res, next) => {
  authController.updateProfile(req, res).catch(next);
});

router.get('/nexconn-token', authenticate, (req, res, next) => {
  authController.getNexconnToken(req, res).catch(next);
});

export default router;
