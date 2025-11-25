import { Router } from 'express';
import { RescueController } from '../controllers/rescue.controller';
import { validateSchema } from '../middleware/validate.middleware';
import { rescueSchema, rescueParticipantSchema, rescueReportSchema } from '../types/validation/rescue.schema';

const router = Router();
const rescueController = new RescueController();

// Rescue CRUD routes
router.get('/', rescueController.getAllRescues);
router.get('/me', rescueController.getMyRescues);
router.get('/:id', rescueController.getRescue);
router.post('/', validateSchema(rescueSchema), rescueController.createRescue);
router.patch('/:id', validateSchema(rescueSchema.partial()), rescueController.updateRescue);
router.delete('/:id', rescueController.deleteRescue);

// Participant management routes
router.post('/:id/join', rescueController.joinRescue);
router.post('/:id/leave', rescueController.leaveRescue);
router.post('/:id/participants', validateSchema(rescueParticipantSchema), rescueController.addParticipant);
router.delete('/participants/:participantId', rescueController.removeParticipant);

// Report management routes
router.post('/:id/reports', validateSchema(rescueReportSchema), rescueController.addReport);
router.patch('/reports/:rescueReportId', validateSchema(rescueReportSchema), rescueController.updateReportStatus);
router.delete('/reports/:rescueReportId', rescueController.removeReport);

// Workflow routes
router.post('/:id/start', rescueController.startRescue);
router.post('/:id/cancel', rescueController.cancelRescue);
router.post('/:id/complete', rescueController.completeRescue);
router.patch('/reports/:rescueReportId/progress', rescueController.updateReportProgress);

// User's rescues
router.get('/user/:userId', rescueController.getUserRescues);

export default router;