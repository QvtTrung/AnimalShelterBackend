import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validateSchema } from '../middleware/validate.middleware';
import {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  userIdSchema,
  userEmailSchema
} from '../types/validation/user.schema';

const router = Router();
const userController = new UserController();

// User routes
router.get('/', userController.getAllUsers);
router.get('/me', userController.getCurrentUser);
router.patch('/me', validateSchema(updateProfileSchema), userController.updateCurrentUser);
router.get('/:id', validateSchema(userIdSchema), userController.getUser);
router.post('/', validateSchema(createUserSchema), userController.createUser);
router.patch('/:id', validateSchema(updateUserSchema), userController.updateUser);
router.delete('/:id', validateSchema(userIdSchema), userController.deleteUser);
router.get('/email/:email', validateSchema(userEmailSchema), userController.getUserByEmail);
router.get('/directus/:directusUserId', userController.getUserByDirectusId);

export default router;
