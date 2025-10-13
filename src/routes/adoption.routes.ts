import { Router } from 'express';
import { AdoptionController } from '../controllers/adoption.controller';
import { validateSchema } from '../middleware/validate.middleware';
import {
  adoptionIdSchema,
  createAdoptionSchema,
  updateAdoptionSchema,
  updateAdoptionStatusSchema,
  userIdSchema,
  petIdSchema
} from '../types/validation/adoption.schema';

const router = Router();
const adoptionController = new AdoptionController();

// Adoption routes
router.get('/', adoptionController.getAllAdoptions);
router.get('/:id', validateSchema(adoptionIdSchema), adoptionController.getAdoption);
router.post('/', validateSchema(createAdoptionSchema), adoptionController.createAdoption);
router.patch('/:id', validateSchema(updateAdoptionSchema), adoptionController.updateAdoption);
router.delete('/:id', validateSchema(adoptionIdSchema), adoptionController.deleteAdoption);

// Additional adoption-specific routes
router.get('/user/:userId', validateSchema(userIdSchema), adoptionController.getUserAdoptions);
router.get('/pet/:petId', validateSchema(petIdSchema), adoptionController.getPetAdoptions);
router.patch('/:id/status', validateSchema(updateAdoptionStatusSchema), adoptionController.updateAdoptionStatus);

export default router;