import { BaseService } from './base.service';
import { DirectusRescue } from '../types/directus';
import { readItems, createItem, deleteItem, updateItem } from '@directus/sdk';

export class RescueService extends BaseService<DirectusRescue> {
  constructor() {
    super('rescues');
  }

  async findAll(query?: any): Promise<{ data: any[]; total: number }> {
    try {
      const { page = 1, limit = 10, ...restQuery } = query || {};
      const offset = (page - 1) * limit;

      // Get total count
      const countResponse = await this.sdk.request(readItems(this.collection, {
        aggregate: { count: '*' },
        ...restQuery?.filter ? { filter: restQuery.filter } : {},
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
          'reports.reports_id',
          'reports.status',
          'reports.note',
          'reports.report.id',
          'reports.report.title',
          'reports.report.status',
          'reports.report.urgency_level',
          'reports.report.location'
        ],
        limit,
        offset,
      }));

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
          'reports.reports_id',
          'reports.status',
          'reports.note',
          'reports.report.id',
          'reports.report.title',
          'reports.report.status',
          'reports.report.urgency_level',
          'reports.report.location'
        ],
        limit: 1,
      }));
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
      return await this.sdk.request(createItem('rescues_reports', {
        rescues_id: rescueId,
        reports_id: reportId,
        status: 'in_progress'
      }));
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
    } catch (error) {
      throw this.handleError(error);
    }
  }
}