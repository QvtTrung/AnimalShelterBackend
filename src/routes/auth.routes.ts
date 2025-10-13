import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateSchema } from '../middleware/validate.middleware';
import { LoginPayloadSchema, RegisterPayloadSchema } from '../types/validation/auth.schema';

const router = Router();
const authController = new AuthController();


router.post('/login', validateSchema(LoginPayloadSchema), authController.login);
router.post('/register', validateSchema(RegisterPayloadSchema), authController.register);
router.post('/logout', authController.logout);
router.get('/me', authController.getCurrentUser);

export default router;