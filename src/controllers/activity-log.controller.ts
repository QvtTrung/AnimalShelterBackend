import { Request, Response, NextFunction } from 'express';
import { ActivityLogService } from '../services/activity-log.service';
import { sendSuccess } from '../utils/response';

export class ActivityLogController {
  private activityLogService: ActivityLogService;

  constructor() {
    this.activityLogService = new ActivityLogService();
  }

  /**
   * GET /activities
   * Get all activity logs with filtering
   */
  getAllActivities = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.activityLogService.getActivities(req.query);
      sendSuccess(res, result.data, 200, { total: result.total });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /activities/recent
   * Get recent activities for dashboard
   */
  getRecentActivities = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await this.activityLogService.getRecentActivities(limit);
      sendSuccess(res, activities, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /activities/:id
   * Get a specific activity by ID
   */
  getActivityById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const activity = await this.activityLogService.getActivityById(req.params.id);
      if (!activity) {
        return res.status(404).json({
          status: 'fail',
          message: 'Activity not found',
        });
      }
      sendSuccess(res, activity, 200);
    } catch (error) {
      next(error);
    }
  };
}
