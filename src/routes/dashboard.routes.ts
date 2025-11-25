import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
const dashboardController = new DashboardController();

/**
 * @route GET /api/dashboard/analytics
 * @desc Get dashboard analytics data
 * @access Private
 */
router.get('/analytics', dashboardController.getAnalytics);

/**
 * @route GET /api/dashboard/stats
 * @desc Get user-specific dashboard stats
 * @access Private
 */
router.get('/stats', requireAuth, dashboardController.getStats);

/**
 * @route GET /api/dashboard/activity
 * @desc Get user's recent activity
 * @access Private
 */
router.get('/activity', requireAuth, dashboardController.getActivity);

/**
 * @route GET /api/dashboard/nearby-reports
 * @desc Get reports nearby user's location
 * @access Private
 * @query latitude, longitude (optional if user has coordinates in profile)
 * @query radius (in meters, default: 25000)
 */
router.get('/nearby-reports', requireAuth, dashboardController.getNearbyReports);

export default router;
