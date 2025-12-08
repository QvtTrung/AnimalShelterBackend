import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { AppError } from '../utils/errors';
import { directus } from '../config/directus';
import { readMe } from '@directus/sdk';

// Async handler wrapper
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Get current user's Directus ID from token
   */
  private async getCurrentUserId(): Promise<string> {
    try {
      // Use the directus client which has the user's token set by auth middleware
      const directusUser = await directus.request(readMe({ fields: ['id'] }));
      if (!directusUser || !directusUser.id) {
        throw new AppError(401, 'fail', 'Người dùng chưa đăng nhập');
      }
      return directusUser.id;
    } catch (error: any) {
      // Check if token expired
      if (error?.message?.includes('expired') || error?.message?.includes('Token expired')) {
        throw new AppError(401, 'fail', 'Token expired. Please refresh your session.');
      }
      throw new AppError(401, 'fail', 'User not authenticated');
    }
  }

  /**
   * Get all notifications for the authenticated user
   */
  getUserNotifications = asyncHandler(async (req: Request, res: Response) => {
    const userId = await this.getCurrentUserId();
    const unreadOnly = req.query.unreadOnly === 'true';
    const result = await this.notificationService.getUserNotifications(userId, unreadOnly, req.query);

    res.status(200).json({
      status: 'success',
      data: result.data,
      total: result.total,
    });
  });

  /**
   * Mark a notification as read
   */
  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.notificationService.markAsRead(id);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  /**
   * Mark all notifications as read for the authenticated user
   */
  markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = await this.getCurrentUserId();
    const result = await this.notificationService.markAllAsRead(userId);

    res.status(200).json({
      status: 'success',
      message: `${result.updated} thông báo đã được đánh dấu là đã đọc`,
      data: result,
    });
  });

  /**
   * Get unread notification count
   */
  getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    const userId = await this.getCurrentUserId();
    const result = await this.notificationService.getUserNotifications(userId, true);

    res.status(200).json({
      status: 'success',
      data: {
        count: result.total,
      },
    });
  });

  /**
   * Get a single notification by ID
   */
  getNotificationById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = await this.getCurrentUserId();
    const result = await this.notificationService.getNotificationById(id, userId);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  });
}
