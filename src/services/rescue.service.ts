import { BaseService } from './base.service';
import { DirectusRescue } from '../types/directus';
import { readItems, createItem, deleteItem, updateItem, readItem } from '@directus/sdk';
import { AppError } from '../utils/errors';
import { NotificationService } from './notification.service';

export class RescueService extends BaseService<DirectusRescue> {
  private notificationService: NotificationService;

  constructor() {
    super('rescues');
    this.notificationService = new NotificationService();
  }

  async findAll(query?: any): Promise<{ data: any[]; total: number }> {
    try {
      const { page = 1, limit = 10, status, ...restQuery } = query || {};
      const offset = (page - 1) * limit;

      // Build filter object
      let filter: any = {};
      
      // Add status filter
      if (status) {
        filter.status = { _eq: status };
      }
      
      // Merge with any existing filters from restQuery
      if (restQuery?.filter) {
        filter = { ...filter, ...restQuery.filter };
      }

      // Get total count with filter
      const countResponse = await this.sdk.request(readItems(this.collection, {
        aggregate: { count: '*' },
        ...(Object.keys(filter).length > 0 ? { filter } : {}),
      }));
      
      const total = countResponse?.[0]?.count ?? 0;

      // Get items with related data
      const items = await this.sdk.request(readItems(this.collection, {
        ...restQuery,
        fields: [
          '*',
          'participants.id',
          'participants.users_id',
          'participants.role',
          'participants.user.id',
          'participants.user.email',
          'participants.user.first_name',
          'participants.user.last_name',
          'participants.user.avatar',
          'reports.id',
          'reports.reports_id.*',
          'reports.status',
          'reports.note',
          'reports.updated_at'
        ],
        limit,
        offset,
        ...(Object.keys(filter).length > 0 ? { filter } : {}),
      }));
      // console.log('items',items);

      return {
        data: Array.isArray(items) ? items : [],
        total,
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string, query?: any) {
    try {
      const items = await this.sdk.request(readItems(this.collection, {
        ...query,
        filter: { id: { _eq: id } },
        fields: [
          '*',
          'participants.id',
          'participants.users_id',
          'participants.role',
          'participants.user.id',
          'participants.user.email',
          'participants.user.first_name',
          'participants.user.last_name',
          'participants.user.avatar',
          'reports.id',
          'reports.reports_id.*',
          'reports.status',
          'reports.note',
          'reports.updated_at'
        ],
        limit: 1,
      }));
      // console.log('items',items);
      return items?.[0];
    } catch (error) {
      throw error;
    }
  }

  // Add participant to rescue
  async addParticipant(rescueId: string, userId: string, role: 'leader' | 'member' = 'member') {
    try {
      // Get rescue details
      const rescue = await this.findOne(rescueId);
      if (!rescue) {
        throw new AppError(404, 'fail', 'Rescue not found');
      }

      const participant = await this.sdk.request(createItem('rescues_users', {
        rescues_id: rescueId,
        users_id: userId,
        role,
      }));

      // Send assignment notification
      await this.notificationService.sendRescueAssignmentNotification(
        rescueId,
        userId,
        rescue.location || 'Unknown location',
        rescue.description || 'No description available'
      );

      return participant;
    } catch (error) {
      throw error;
    }
  }

  // Update participant status
  // async updateParticipantStatus(participantId: string, status: 'invited' | 'accepted' | 'declined') {
  //   try {
  //     return await this.sdk.request(updateItem('rescues_users', participantId, { status }));
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  // Remove participant from rescue
  async removeParticipant(participantId: string) {
    try {
      await this.sdk.request(deleteItem('rescues_users', participantId));
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Add report to rescue
  async addReport(rescueId: string, reportId: string) {
    try {
      // Validate rescue status - can only add reports to 'planned' rescues
      const rescue = await this.findOne(rescueId);
      if (!rescue) {
        throw new AppError(404, 'fail', 'Rescue not found');
      }

      if (rescue.status !== 'planned') {
        throw new AppError(400, 'fail', 'Chỉ có thể thêm báo cáo vào chiến dịch đã lập kế hoạch');
      }

      // Validate report exists and has 'pending' status
      const report = await this.sdk.request(readItem('reports', reportId));
      if (!report) {
        throw new AppError(404, 'fail', 'Không tìm thấy báo cáo');
      }

      if (report.status !== 'pending') {
        throw new AppError(400, 'fail', 'Chỉ có thể thêm báo cáo đang chờ xử lý vào chiến dịch cứu hộ');
      }

      // Create the rescue-report relationship
      const rescueReport = await this.sdk.request(createItem('rescues_reports', {
        rescues_id: rescueId,
        reports_id: reportId,
        status: 'in_progress'
      }));

      // Update report status to 'assigned'
      await this.sdk.request(updateItem('reports', reportId, {
        status: 'assigned'
      }));

      return rescueReport;
    } catch (error) {
      throw error;
    }
  }

  // Update report status in rescue
  async updateReportStatus(rescueReportId: string, status: 'pending' | 'in_progress' | 'resolved', note?: string) {
    try {
      return await this.sdk.request(updateItem('rescues_reports', rescueReportId, { 
        status,
        ...(note && { note })
      }));
    } catch (error) {
      throw error;
    }
  }

  // Remove report from rescue
  async removeReport(rescueReportId: string) {
    try {
      // Get the rescue-report relationship to find the actual report ID
      const rescueReport = await this.sdk.request(readItem('rescues_reports', rescueReportId, {
        fields: ['*', 'reports_id', 'rescues_id.*']
      }));

      if (!rescueReport) {
        throw new AppError(404, 'fail', 'Không tìm thấy báo cáo cứu hộ');
      }

      const reportId = typeof rescueReport.reports_id === 'object' 
        ? rescueReport.reports_id.id 
        : rescueReport.reports_id;

      // Delete the rescue-report relationship
      await this.sdk.request(deleteItem('rescues_reports', rescueReportId));

      // Update the report status back to 'pending' when removed from rescue
      await this.sdk.request(updateItem('reports', reportId, {
        status: 'pending'
      }));

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get rescues by participant
  async getUserRescues(userId: string) {
    try {
      return await this.findAll({
        filter: {
          participants: {
            users_id: { _eq: userId }
          }
        }
      });
    } catch (error: any) {
      // Check if it's an authentication error from Directus
      if (error.message?.includes('Invalid user credentials') || 
          error.message?.includes('permission') ||
          error.response?.status === 401 ||
          error.response?.status === 403) {
        throw new AppError(401, 'fail', 'Thông tin đăng nhập không hợp lệ.');
      }
      throw this.handleError(error);
    }
  }

  /**
   * Start a rescue campaign
   * Changes rescue status from 'planned' to 'in_progress'
   */
  async startRescue(rescueId: string) {
    try {
      const rescue = await this.findOne(rescueId);
      if (!rescue) {
        throw new AppError(404, 'fail', 'Rescue not found');
      }

      if (rescue.status !== 'planned') {
        throw new AppError(400, 'fail', 'Can only start rescues with planned status');
      }

      // Check if rescue has participants
      if (!rescue.participants || rescue.participants.length === 0) {
        throw new AppError(400, 'fail', 'Cannot start rescue without participants');
      }

      // Check if rescue has reports
      if (!rescue.reports || rescue.reports.length === 0) {
        throw new AppError(400, 'fail', 'Cannot start rescue without assigned reports');
      }

      // Update rescue status to 'in_progress'
      const updatedRescue = await this.update(rescueId, {
        status: 'in_progress'
      });

      // Notify all participants
      if (rescue.participants && rescue.participants.length > 0) {
        for (const participant of rescue.participants) {
          const userId = typeof participant.users_id === 'object' 
            ? participant.users_id.id 
            : participant.users_id;

          if (userId) {
            await this.notificationService.sendRescueStatusUpdate(
              rescueId,
              userId,
              'in_progress',
              'The rescue mission has started. Please head to the location.'
            );
          }
        }
      }

      return updatedRescue;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel a rescue
   * Changes rescue status to 'cancelled' and resets all related reports to 'pending'
   * Can cancel rescues that are 'planned' or 'in_progress'
   */
  async cancelRescue(rescueId: string, reason?: string) {
    try {
      const rescue = await this.findOne(rescueId);
      if (!rescue) {
        throw new AppError(404, 'fail', 'Rescue not found');
      }

      if (rescue.status !== 'planned' && rescue.status !== 'in_progress') {
        throw new AppError(400, 'fail', 'Chỉ có thể hủy chiến dịch ở trạng thái đã lập kế hoạch hoặc đang tiến hành');
      }

      // Update all related reports back to 'pending' status and notify reporters
      if (rescue.reports && rescue.reports.length > 0) {
        for (const rescueReport of rescue.reports) {
          const reportId = typeof rescueReport.reports_id === 'object' 
            ? rescueReport.reports_id.id 
            : rescueReport.reports_id;
          
          const report = rescueReport.reports_id;
          const reportCreatorId = typeof report === 'object' && report.user_created
            ? (typeof report.user_created === 'object' ? report.user_created.id : report.user_created)
            : null;

          await this.sdk.request(updateItem('reports', reportId, {
            status: 'pending'
          }));

          // Update rescue-report status to 'cancelled'
          await this.sdk.request(updateItem('rescues_reports', rescueReport.id, {
            status: 'cancelled',
            note: reason ? `Cancelled: ${reason}` : 'Rescue cancelled'
          }));
          
          // Notify reporter that rescue was cancelled
          if (reportCreatorId) {
            try {
              await this.notificationService.sendReportStatusUpdate(
                reportId,
                reportCreatorId,
                'pending',
                reason 
                  ? `The rescue mission for your report has been cancelled: ${reason}. Your report is back to pending status.`
                  : 'The rescue mission for your report has been cancelled. Your report is back to pending status and may be claimed by another team.'
              );
            } catch (notifError) {
              console.error('Failed to notify reporter:', notifError);
            }
          }
        }
      }

      // Update rescue status to 'cancelled'
      const updatedRescue = await this.update(rescueId, {
        status: 'cancelled',
        description: reason 
          ? `${rescue.description || ''}\n\n[Cancelled: ${reason}]`
          : rescue.description
      });

      // Notify all participants
      if (rescue.participants && rescue.participants.length > 0) {
        for (const participant of rescue.participants) {
          const userId = typeof participant.users_id === 'object' 
            ? participant.users_id.id 
            : participant.users_id;

          if (userId) {
            await this.notificationService.sendRescueStatusUpdate(
              rescueId,
              userId,
              'cancelled',
              reason || 'The rescue mission has been cancelled.'
            );
          }
        }
      }

      return updatedRescue;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update report progress in a rescue
   * Only allowed for rescues with 'in_progress' status
   */
  async updateReportProgress(rescueReportId: string, status: 'in_progress' | 'success' | 'cancelled', note?: string) {
    try {
      // Get the rescue-report relationship
      const rescueReport = await this.sdk.request(readItem('rescues_reports', rescueReportId, {
        fields: ['*', 'rescues_id.*']
      }));

      if (!rescueReport) {
        throw new AppError(404, 'fail', 'Không tìm thấy báo cáo cứu hộ');
      }

      // Validate rescue is in_progress
      const rescue = typeof rescueReport.rescues_id === 'object' 
        ? rescueReport.rescues_id 
        : await this.findOne(rescueReport.rescues_id);

      if (rescue.status !== 'in_progress') {
        throw new AppError(400, 'fail', 'Chỉ có thể cập nhật tiến độ báo cáo cho chiến dịch đang tiến hành');
      }

      // Update the rescue-report status
      return await this.sdk.request(updateItem('rescues_reports', rescueReportId, {
        status,
        note: note || rescueReport.note,
        updated_at: new Date().toISOString()
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Complete a rescue campaign
   * Updates rescue status to 'completed'
   * For each report: if 'success' -> set to 'resolved', otherwise -> set back to 'pending'
   * Validates that all reports are either 'success' or 'cancelled' (not 'in_progress')
   */
  async completeRescue(rescueId: string) {
    try {
      const rescue = await this.findOne(rescueId);
      if (!rescue) {
        throw new AppError(404, 'fail', 'Rescue not found');
      }

      if (rescue.status !== 'in_progress') {
        throw new AppError(400, 'fail', 'Chỉ có thể hoàn tất chiến dịch đang tiến hành');
      }

      // Validate that all reports are either 'success' or 'cancelled'
      if (rescue.reports && rescue.reports.length > 0) {
        const inProgressReports = rescue.reports.filter(
          (rescueReport: any) => rescueReport.status === 'in_progress'
        );

        if (inProgressReports.length > 0) {
          throw new AppError(
            400, 
            'fail', 
            `Không thể hoàn tất chiến dịch. Còn ${inProgressReports.length} báo cáo đang xử lý. Vui lòng cập nhật tất cả báo cáo thành 'Hoàn thành' hoặc 'Hủy' trước khi hoàn tất chiến dịch.`
          );
        }
      }

      // Process all related reports and notify reporters
      if (rescue.reports && rescue.reports.length > 0) {
        for (const rescueReport of rescue.reports) {
          const reportId = typeof rescueReport.reports_id === 'object' 
            ? rescueReport.reports_id.id 
            : rescueReport.reports_id;
          
          const report = rescueReport.reports_id;
          const reportCreatorId = typeof report === 'object' && report.user_created
            ? (typeof report.user_created === 'object' ? report.user_created.id : report.user_created)
            : null;

          // Update report status based on rescue-report status
          if (rescueReport.status === 'success') {
            // Mark report as resolved
            await this.sdk.request(updateItem('reports', reportId, {
              status: 'resolved'
            }));
            
            // Notify reporter that their report was successfully resolved
            if (reportCreatorId) {
              try {
                await this.notificationService.sendReportStatusUpdate(
                  reportId,
                  reportCreatorId,
                  'resolved',
                  'Great news! The rescue mission for your report has been successfully completed. Thank you for caring about animal welfare!'
                );
              } catch (notifError) {
                console.error('Failed to notify reporter:', notifError);
              }
            }
          } else if (rescueReport.status === 'cancelled') {
            // Mark report back to pending for cancelled reports
            await this.sdk.request(updateItem('reports', reportId, {
              status: 'pending'
            }));
            
            // Notify reporter that their report is back to pending
            if (reportCreatorId) {
              try {
                await this.notificationService.sendReportStatusUpdate(
                  reportId,
                  reportCreatorId,
                  'pending',
                  'The rescue mission has been completed, but your report was marked as cancelled. It has been returned to pending status for further attention.'
                );
              } catch (notifError) {
                console.error('Failed to notify reporter:', notifError);
              }
            }
          }
        }
      }

      // Update rescue status to 'completed'
      const updatedRescue = await this.update(rescueId, {
        status: 'completed'
      });

      // Notify all participants
      if (rescue.participants && rescue.participants.length > 0) {
        for (const participant of rescue.participants) {
          const userId = typeof participant.users_id === 'object' 
            ? participant.users_id.id 
            : participant.users_id;

          if (userId) {
            await this.notificationService.sendRescueStatusUpdate(
              rescueId,
              userId,
              'completed',
              'The rescue mission has been successfully completed. Thank you for your dedication!'
            );
          }
        }
      }

      return updatedRescue;
    } catch (error) {
      throw error;
    }
  }
}