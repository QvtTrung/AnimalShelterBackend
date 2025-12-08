import { Router } from 'express';
import { ActivityLogController } from '../controllers/activity-log.controller';
import { validateSchema } from '../middleware/validate.middleware';
import { getActivityLogsSchema } from '../types/validation/activity-log.schema';

const router = Router();
const activityLogController = new ActivityLogController();

// Activity log routes
router.get('/', validateSchema(getActivityLogsSchema), activityLogController.getAllActivities);
router.get('/recent', activityLogController.getRecentActivities);
router.get('/:id', activityLogController.getActivityById);

export default router;
