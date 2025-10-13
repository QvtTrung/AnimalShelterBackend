import { Router } from 'express';
import { RescueController } from '../controllers/rescue.controller';

const router = Router();
const rescueController = new RescueController();

// Rescue CRUD routes
router.get('/', rescueController.getAllRescues);
router.get('/:id', rescueController.getRescue);
router.post('/', rescueController.createRescue);
router.patch('/:id', rescueController.updateRescue);
router.delete('/:id', rescueController.deleteRescue);

// Additional rescue routes
// router.get('/user/:userId', rescueController.getUserRescues);
// router.get('/pet/:petId', rescueController.getPetRescues);
// router.patch('/:id/veterinary-status', rescueController.updateVeterinaryStatus);

export default router;