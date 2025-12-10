import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateSchema } from '../middleware/validate.middleware';
import { LoginPayloadSchema, RegisterPayloadSchema, ChangePasswordSchema } from '../types/validation/auth.schema';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();


router.post('/login', validateSchema(LoginPayloadSchema), authController.login);
router.post('/register', validateSchema(RegisterPayloadSchema), authController.register);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);
router.get('/me', authController.getCurrentUser);
router.post('/change-password', requireAuth, validateSchema(ChangePasswordSchema), authController.changePassword);

export default router;