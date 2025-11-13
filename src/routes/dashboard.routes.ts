import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();
const dashboardController = new DashboardController();

/**
 * @route GET /api/dashboard/analytics
 * @desc Get dashboard analytics data
 * @access Private
 */
router.get('/analytics', dashboardController.getAnalytics);

export default router;
