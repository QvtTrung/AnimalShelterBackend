import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { asyncHandler } from '../middleware/error.middleware';
import { sendSuccess, sendError } from '../utils/response';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  /**
   * Get dashboard analytics
   */
  getAnalytics = asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 'default-user';

      const analytics = await this.dashboardService.getDashboardAnalytics(userId);

      sendSuccess(res, analytics, 200);
    } catch (error) {
      return sendError(res, error);
    }
  });
}
