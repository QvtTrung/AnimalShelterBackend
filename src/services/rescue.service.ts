import { BaseService } from './base.service';
import { DirectusRescue } from '../types/directus';
import { readItems, createItem, deleteItem, updateItem, readItem } from '@directus/sdk';
import { AppError } from '../utils/errors';

export class RescueService extends BaseService<DirectusRescue> {
  constructor() {
    super('rescues');
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
      return await this.sdk.request(createItem('rescues_users', {
        rescues_id: rescueId,
        users_id: userId,
        role,
      }));
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
        throw new AppError(400, 'fail', 'Can only add reports to planned rescues');
      }

      // Validate report exists and has 'pending' status
      const report = await this.sdk.request(readItem('reports', reportId));
      if (!report) {
        throw new AppError(404, 'fail', 'Report not found');
      }

      if (report.status !== 'pending') {
        throw new AppError(400, 'fail', 'Can only add reports with pending status to a rescue');
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
      await this.sdk.request(deleteItem('rescues_reports', rescueReportId));
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
        throw new AppError(401, 'fail', 'Invalid user credentials.');
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
      return await this.update(rescueId, {
        status: 'in_progress'
      });
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
        throw new AppError(400, 'fail', 'Can only cancel rescues with planned or in_progress status');
      }

      // Update all related reports back to 'pending' status
      if (rescue.reports && rescue.reports.length > 0) {
        for (const rescueReport of rescue.reports) {
          const reportId = typeof rescueReport.reports_id === 'object' 
            ? rescueReport.reports_id.id 
            : rescueReport.reports_id;

          await this.sdk.request(updateItem('reports', reportId, {
            status: 'pending'
          }));

          // Update rescue-report status to 'cancelled'
          await this.sdk.request(updateItem('rescues_reports', rescueReport.id, {
            status: 'cancelled',
            note: reason ? `Cancelled: ${reason}` : 'Rescue cancelled'
          }));
        }
      }

      // Update rescue status to 'cancelled'
      return await this.update(rescueId, {
        status: 'cancelled',
        description: reason 
          ? `${rescue.description || ''}\n\n[Cancelled: ${reason}]`
          : rescue.description
      });
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
        throw new AppError(404, 'fail', 'Rescue report not found');
      }

      // Validate rescue is in_progress
      const rescue = typeof rescueReport.rescues_id === 'object' 
        ? rescueReport.rescues_id 
        : await this.findOne(rescueReport.rescues_id);

      if (rescue.status !== 'in_progress') {
        throw new AppError(400, 'fail', 'Can only update report progress for rescues in progress');
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
   */
  async completeRescue(rescueId: string) {
    try {
      const rescue = await this.findOne(rescueId);
      if (!rescue) {
        throw new AppError(404, 'fail', 'Rescue not found');
      }

      if (rescue.status !== 'in_progress') {
        throw new AppError(400, 'fail', 'Can only complete rescues that are in progress');
      }

      // Process all related reports
      if (rescue.reports && rescue.reports.length > 0) {
        for (const rescueReport of rescue.reports) {
          const reportId = typeof rescueReport.reports_id === 'object' 
            ? rescueReport.reports_id.id 
            : rescueReport.reports_id;

          // Update report status based on rescue-report status
          if (rescueReport.status === 'success') {
            // Mark report as resolved
            await this.sdk.request(updateItem('reports', reportId, {
              status: 'resolved'
            }));
          } else {
            // Mark report back to pending (including cancelled or still in_progress)
            await this.sdk.request(updateItem('reports', reportId, {
              status: 'pending'
            }));
          }
        }
      }

      // Update rescue status to 'completed'
      return await this.update(rescueId, {
        status: 'completed'
      });
    } catch (error) {
      throw error;
    }
  }
}