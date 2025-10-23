import { Router } from 'express';
import { PetController } from '../controllers/pet.controller';
import { upload } from '../middleware/upload.middleware';
import { validateSchema, validateFileUpload } from '../middleware/validate.middleware';
import { validateFormData } from '../middleware/form-data.middleware';
import {
  createPetSchema,
  updatePetSchema,
  petIdSchema,
  // petImageSchema,
  deletePetImageSchema
} from '../types/validation/pet.schema';

const router = Router();
const petController = new PetController();

// Pet routes
router.get('/', petController.getAllPets);
router.get('/:id', validateSchema(petIdSchema), petController.getPet);
router.post('/', upload.array('images', 5), validateFormData(createPetSchema), petController.createPet);
router.patch('/:id', validateSchema(updatePetSchema), petController.updatePet);
router.delete('/:id', validateSchema(petIdSchema), petController.deletePet);

// Pet image routes
router.get('/:id/images', validateSchema(petIdSchema), petController.getPetImages);
router.post('/:id/images',
  validateSchema(petIdSchema), // Only validate the pet ID in params
  upload.array('images', 5), // Allow up to 5 images
  validateFileUpload(),
  petController.uploadPetImages
);
router.delete('/:id/images/:imageId',
  validateSchema(deletePetImageSchema),
  petController.deletePetImage);

export default router;