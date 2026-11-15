import { Router } from 'express';
import { authController } from './authController';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validator';
import { registerSchema, loginSchema } from '../../../../shared';

const router = Router();

router.post('/register', validateBody(registerSchema), (req, res, next) => {
  authController.register(req, res).catch(next);
});

router.post('/check-account', (req, res, next) => {
  authController.checkAccount(req, res).catch(next);
});

router.post('/firebase-sync', (req, res, next) => {
  authController.syncFirebaseUser(req, res).catch(next);
});

router.post('/login', validateBody(loginSchema), (req, res, next) => {
  authController.login(req, res).catch(next);
});

router.get('/me', authenticate, (req, res, next) => {
  authController.getMe(req, res).catch(next);
});

router.get('/customer-overview', authenticate, (req, res, next) => {
  authController.getCustomerOverview(req, res).catch(next);
});

router.patch('/profile', authenticate, (req, res, next) => {
  authController.updateProfile(req, res).catch(next);
});

router.post('/public-key', authenticate, (req, res, next) => {
  authController.publishPublicKey(req, res).catch(next);
});

router.get('/public-key/:targetId', authenticate, (req, res, next) => {
  authController.getPublicKey(req, res).catch(next);
});

router.get('/nexconn-token', authenticate, (req, res, next) => {
  authController.getNexconnToken(req, res).catch(next);
});

export default router;
