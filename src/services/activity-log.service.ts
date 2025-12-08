import { BaseService } from './base.service';
import { DirectusActivityLog, ActivityLogCreateInput } from '../types/interfaces/activity-log.interface';
import { createItem, readItems } from '@directus/sdk';
import { adminDirectus } from '../config/directus';

export class ActivityLogService extends BaseService<DirectusActivityLog> {
  constructor() {
    super('activity_log');
  }

  /**
   * Log an activity
   * Uses adminDirectus to bypass permissions
   */
  async log(input: ActivityLogCreateInput): Promise<DirectusActivityLog> {
    try {
      const activity = await adminDirectus.request(
        createItem('activity_log', input)
      ) as DirectusActivityLog;
      return activity;
    } catch (error) {
      console.error('Error creating activity log:', error);
      throw error;
    }
  }

  /**
   * Log user registration
   */
  async logUserRegistration(userId: string, userName: string, userEmail: string) {
    return this.log({
      action: 'user_registered',
      actor_id: userId,
      actor_name: userName,
      target_type: 'user',
      target_id: userId,
      description: `${userName} (${userEmail}) registered on the platform`,
      details: { email: userEmail },
    });
  }

  /**
   * Log report creation
   */
  async logReportCreated(
    reportId: string,
    reportType: string,
    urgencyLevel: string,
    location: string,
    reporterName: string,
    reporterId?: string
  ) {
    return this.log({
      action: 'report_created',
      actor_id: reporterId,
      actor_name: reporterName,
      target_type: 'report',
      target_id: reportId,
      description: `${reporterName} posted a ${urgencyLevel} ${reportType} report at ${location}`,
      details: {
        type: reportType,
        urgency_level: urgencyLevel,
        location,
      },
    });
  }

  /**
   * Log adoption request
   */
  async logAdoptionRequested(
    adoptionId: string,
    petName: string,
    petSpecies: string,
    adopterName: string,
    adopterEmail: string,
    adopterId?: string
  ) {
    return this.log({
      action: 'adoption_requested',
      actor_id: adopterId,
      actor_name: adopterName,
      target_type: 'adoption',
      target_id: adoptionId,
      description: `${adopterName} submitted an adoption request for ${petName} (${petSpecies})`,
      details: {
        pet_name: petName,
        pet_species: petSpecies,
        adopter_email: adopterEmail,
      },
    });
  }

  /**
   * Log report claimed (rescue created)
   */
  async logReportClaimed(
    rescueId: string,
    reportId: string,
    claimerName: string,
    claimerId: string,
    location: string,
    reportType: string
  ) {
    return this.log({
      action: 'report_claimed',
      actor_id: claimerId,
      actor_name: claimerName,
      target_type: 'rescue',
      target_id: rescueId,
      description: `${claimerName} claimed a ${reportType} report at ${location}`,
      details: {
        report_id: reportId,
        report_type: reportType,
        location,
      },
    });
  }

  /**
   * Log rescue status update
   */
  async logRescueStatusUpdate(
    rescueId: string,
    oldStatus: string,
    newStatus: string,
    updatedBy?: string
  ) {
    return this.log({
      action: 'rescue_status_updated',
      actor_id: updatedBy,
      target_type: 'rescue',
      target_id: rescueId,
      description: `Rescue status changed from ${oldStatus} to ${newStatus}`,
      details: {
        old_status: oldStatus,
        new_status: newStatus,
      },
    });
  }

  /**
   * Log adoption status update
   */
  async logAdoptionStatusUpdate(
    adoptionId: string,
    oldStatus: string,
    newStatus: string,
    updatedBy?: string
  ) {
    return this.log({
      action: 'adoption_status_updated',
      actor_id: updatedBy,
      target_type: 'adoption',
      target_id: adoptionId,
      description: `Adoption status changed from ${oldStatus} to ${newStatus}`,
      details: {
        old_status: oldStatus,
        new_status: newStatus,
      },
    });
  }

  /**
   * Get activity logs with filtering
   */
  async getActivities(query?: any): Promise<{ data: DirectusActivityLog[]; total: number }> {
    try {
      const page = Number(query?.page) || 1;
      const limit = Number(query?.limit) || 25;
      const offset = (page - 1) * limit;

      // Build filter
      const filter: any = {};
      if (query?.action) filter.action = { _eq: query.action };
      if (query?.actor_id) filter.actor_id = { _eq: query.actor_id };
      if (query?.target_type) filter.target_type = { _eq: query.target_type };
      if (query?.target_id) filter.target_id = { _eq: query.target_id };
      if (query?.date_from || query?.date_to) {
        filter.date_created = {};
        if (query.date_from) filter.date_created._gte = query.date_from;
        if (query.date_to) filter.date_created._lte = query.date_to;
      }

      // Get count
      const countResponse = await adminDirectus.request(
        readItems('activity_log', {
          aggregate: { count: '*' },
          filter,
        })
      );
      const total = countResponse?.[0]?.count ?? 0;

      // Get activities
      const activities = await adminDirectus.request(
        readItems('activity_log', {
          filter,
          limit,
          offset,
          sort: ['-date_created'],
        })
      ) as DirectusActivityLog[];

      return { data: activities, total };
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
  }

  /**
   * Get recent activities for dashboard
   */
  async getRecentActivities(limit: number = 10): Promise<DirectusActivityLog[]> {
    try {
      const activities = await adminDirectus.request(
        readItems('activity_log', {
          limit,
          sort: ['-date_created'],
        })
      ) as DirectusActivityLog[];
      return activities;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  }

  /**
   * Get a specific activity by ID
   */
  async getActivityById(id: string): Promise<DirectusActivityLog | null> {
    try {
      const activities = await adminDirectus.request(
        readItems('activity_log', {
          filter: { id: { _eq: id } },
          limit: 1,
        })
      ) as DirectusActivityLog[];
      return activities && activities.length > 0 ? activities[0] : null;
    } catch (error) {
      console.error('Error fetching activity by ID:', error);
      throw error;
    }
  }
}

export const activityLogService = new ActivityLogService();
