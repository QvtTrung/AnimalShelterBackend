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

  /**
   * Get user-specific dashboard stats
   */
  getStats = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Get current authenticated user ID
      const { readMe, readItems } = await import('@directus/sdk');
      const { directus } = await import('../config/directus');
      
      const currentUser = await directus.request(readMe({ fields: ['id'] }));
      
      if (!currentUser || !currentUser.id) {
        const error = new Error('Authentication required');
        (error as any).statusCode = 401;
        return sendError(res, error, 401);
      }
      
      const appUsers = await directus.request(readItems('users', {
        filter: { directus_user_id: { _eq: currentUser.id } },
        fields: ['id'],
        limit: 1
      }));
      
      if (!appUsers || appUsers.length === 0) {
        const error = new Error('User profile not found');
        (error as any).statusCode = 404;
        return sendError(res, error, 404);
      }
      
      const userId = appUsers[0].id;
      const stats = await this.dashboardService.getUserStats(userId);

      sendSuccess(res, stats, 200);
    } catch (error) {
      return sendError(res, error);
    }
  });

  /**
   * Get user's recent activity
   */
  getActivity = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Get current authenticated user ID
      const { readMe, readItems } = await import('@directus/sdk');
      const { directus } = await import('../config/directus');
      
      const currentUser = await directus.request(readMe({ fields: ['id'] }));
      
      if (!currentUser || !currentUser.id) {
        const error = new Error('Authentication required');
        (error as any).statusCode = 401;
        return sendError(res, error, 401);
      }
      
      const appUsers = await directus.request(readItems('users', {
        filter: { directus_user_id: { _eq: currentUser.id } },
        fields: ['id'],
        limit: 1
      }));
      
      if (!appUsers || appUsers.length === 0) {
        const error = new Error('User profile not found');
        (error as any).statusCode = 404;
        return sendError(res, error, 404);
      }
      
      const userId = appUsers[0].id;
      const activity = await this.dashboardService.getUserActivity(userId);

      sendSuccess(res, activity, 200);
    } catch (error) {
      return sendError(res, error);
    }
  });

  /**
   * Get nearby reports based on user's coordinates or address
   */
  getNearbyReports = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Get coordinates from query params (session-based) or from user profile
      const { latitude, longitude, radius = 25000 } = req.query;
      
      let userLat: number | undefined;
      let userLng: number | undefined;

      if (latitude && longitude) {
        // Use coordinates from request (session-based approach)
        userLat = parseFloat(latitude as string);
        userLng = parseFloat(longitude as string);
      } else {
        // Try to get from user profile (if coordinates field exists)
        const { readMe, readItems } = await import('@directus/sdk');
        const { directus } = await import('../config/directus');
        
        const currentUser = await directus.request(readMe({ fields: ['id'] }));
        
        if (!currentUser || !currentUser.id) {
          const error = new Error('Authentication required');
          (error as any).statusCode = 401;
          return sendError(res, error, 401);
        }
        
        const appUsers = await directus.request(readItems('users', {
          filter: { directus_user_id: { _eq: currentUser.id } },
          fields: ['id', 'coordinates'],
          limit: 1
        }));
        
        if (!appUsers || appUsers.length === 0) {
          const error = new Error('User profile not found');
          (error as any).statusCode = 404;
          return sendError(res, error, 404);
        }

        const userCoordinates = (appUsers[0] as any).coordinates;
        if (userCoordinates) {
          // Parse coordinates based on storage format
          if (typeof userCoordinates === 'object' && userCoordinates.coordinates) {
            // GeoJSON format
            [userLng, userLat] = userCoordinates.coordinates;
          } else if (typeof userCoordinates === 'string') {
            // Try to parse as JSON
            try {
              const parsed = JSON.parse(userCoordinates);
              if (parsed.coordinates) {
                [userLng, userLat] = parsed.coordinates;
              }
            } catch (e) {
              console.warn('Failed to parse user coordinates');
            }
          }
        }
      }

      if (!userLat || !userLng) {
        const error = new Error('Không có tọa độ người dùng. Vui lòng cung cấp vị trí hoặc cập nhật hồ sơ của bạn.');
        (error as any).statusCode = 400;
        return sendError(res, error, 400);
      }

      const radiusMeters = parseInt(radius as string);
      const nearbyReports = await this.dashboardService.getNearbyReports(userLat, userLng, radiusMeters);

      sendSuccess(res, nearbyReports, 200);
    } catch (error) {
      return sendError(res, error);
    }
  });
}

