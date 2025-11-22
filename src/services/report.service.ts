import { BaseService } from './base.service';
import { AppError } from '../utils/errors';
import { readItems } from '@directus/sdk';

interface Report {
  id: string;
  title: string;
  description: string;
  species: string;
  type: 'abuse' | 'abandonment' | 'injured_animal' | 'other';
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  status: 'pending' | 'assigned' | 'resolved';
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  created_at?: Date;
  updated_at?: Date;
  coordinates?: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export class ReportService extends BaseService<Report> {
  constructor() {
    super('reports');
  }

  async findAll(query?: any): Promise<{ data: any[]; total: number }> {
    try {
      // Extract pagination parameters
      const page = Number(query?.page) || 1;
      const limit = Number(query?.limit) || Number(query?.pageSize) || 10;
      const offset = (page - 1) * limit;

      const { page: _, limit: __, pageSize: ___, search, urgency_level, status, ...restQuery } = query || {};

      // Build filter object for search and other filters
      let filter: any = {};
      
      // Add urgency level filter
      if (urgency_level) {
        filter.urgency_level = { _eq: urgency_level };
      }
      
      // Add status filter
      if (status) {
        filter.status = { _eq: status };
      }
      
      // Add search functionality
      if (search) {
        filter._or = [
          { title: { _contains: search } },
          { species: { _contains: search } },
          { location: { _contains: search } },
          { description: { _contains: search } }
        ];
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

      // Get reports with filter and pagination
      const items = await this.sdk.request(readItems(this.collection, {
        ...restQuery,
        limit,
        offset,
        ...(Object.keys(filter).length > 0 ? { filter } : {}),
      }));
      
      console.log('[ReportService] Sample report from findAll:', items?.[0]?.user_created);

      // Manually fetch user_created data from 'users' collection for each report
      const itemsWithUsers = await Promise.all(
        (Array.isArray(items) ? items : []).map(async (report: any) => {
          let userCreated = report.user_created;
          if (userCreated && typeof userCreated === 'string') {
            try {
              // Query the 'users' collection using directus_user_id
              const users = await this.sdk.request(readItems('users', {
                filter: { directus_user_id: { _eq: userCreated } },
                fields: ['id', 'first_name', 'last_name', 'email'],
                limit: 1
              }));
              
              if (users && Array.isArray(users) && users.length > 0) {
                userCreated = users[0];
              }
            } catch (error: any) {
              console.warn(`Could not fetch user for report ${report.id}:`, error.message);
            }
          }
          return { ...report, user_created: userCreated };
        })
      );

      // Manually fetch images for each report
      const itemsWithImages = await Promise.all(
        itemsWithUsers.map(async (report: any) => {
          try {
            const images = await this.sdk.request(readItems('reports_image', {
              fields: ['*'],
              filter: { report_id: { _eq: report.id } }
            }));
            return { ...report, reports_image: images || [] };
          } catch (error: any) {
            // If permission error or not found, return report without images
            console.warn(`Could not fetch images for report ${report.id}:`, error.message);
            return { ...report, reports_image: [] };
          }
        })
      );

      return {
        data: itemsWithImages,
        total,
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string, query?: any): Promise<any> {
    try {
      // Get report first
      const items = await this.sdk.request(readItems(this.collection, {
        ...query,
        filter: { id: { _eq: id } },
        limit: 1,
      }));

      const report = items?.[0];
      console.log('[ReportService] Raw report from Directus:', JSON.stringify(report, null, 2));
      console.log('[ReportService] user_created field:', report?.user_created);
      console.log('[ReportService] user_created type:', typeof report?.user_created);
      if (!report) return null;

      // Manually fetch user_created data from 'users' collection if it exists and is a UUID string
      let userCreated = report.user_created;
      if (userCreated && typeof userCreated === 'string') {
        try {
          // Query the 'users' collection using directus_user_id
          const users = await this.sdk.request(readItems('users', {
            filter: { directus_user_id: { _eq: userCreated } },
            fields: ['id', 'first_name', 'last_name', 'email'],
            limit: 1
          }));
          
          if (users && Array.isArray(users) && users.length > 0) {
            console.log('[ReportService] Fetched user data from users collection:', users[0]);
            userCreated = users[0];
          } else {
            console.warn(`No user found in users collection for directus_user_id: ${userCreated}`);
          }
        } catch (error: any) {
          console.warn(`Could not fetch user data for ${userCreated}:`, error.message);
          // Keep it as UUID string if fetch fails
        }
      }

      // Manually fetch images with error handling
      try {
        const images = await this.sdk.request(readItems('reports_image', {
          fields: ['*'],
          filter: { report_id: { _eq: id } }
        }));
        console.log('Fetched images for report:', id, images);
        return { ...report, user_created: userCreated, reports_image: images || [] };
      } catch (error: any) {
        // If permission error or not found, return report without images
        console.warn(`Could not fetch images for report ${id}:`, error.message);
        return { ...report, user_created: userCreated, reports_image: [] };
      }
    } catch (error) {
      throw error;
    }
  }

  async getUserReports(userId: string) {
    try {
      return await this.findAll({
        filter: {
          user_created: { _eq: userId }
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
      throw error;
    }
  }

  async updateReportStatus(id: string, status: 'pending' | 'assigned' | 'resolved') {
    try {
      return await this.update(id, { status });
    } catch (error) {
      throw error;
    }
  }

  async findPending(query?: any) {
    try {
      return await this.findAll({
        ...query,
        filter: { status: { _eq: 'pending' } },
      });
    } catch (error) {
      throw error;
    }
  }

  async claimReport(reportId: string, userId: string) {
    try {
      // Import createItem directly from SDK
      const { createItem } = await import('@directus/sdk');
      
      // Get the report details
      const report = await this.findOne(reportId);
      if (!report) {
        throw new AppError(404, 'fail', 'Report not found');
      }

      // Create a rescue campaign with in_progress status
      const rescueData = {
        title: `Rescue for: ${report.title}`,
        description: `Emergency rescue for ${report.species} at ${report.location}`,
        status: 'in_progress',
        required_participants: 1,
        start_date: new Date(),
      };

      const rescue = await this.sdk.request(createItem('rescues', rescueData));

      // Link the report to the rescue in rescues_reports junction table
      const rescueReportData = {
        rescues_id: rescue.id,
        reports_id: reportId,
        status: 'in_progress',
        note: 'Report claimed and rescue initiated',
      };

      await this.sdk.request(createItem('rescues_reports', rescueReportData));

      // Add the claiming user as a participant in rescues_users junction table
      const rescueUserData = {
        rescues_id: rescue.id,
        users_id: userId,
        role: 'leader',
        created_at: new Date(),
        updated_at: new Date(),
      };

      await this.sdk.request(createItem('rescues_users', rescueUserData));

      // Update the report status to 'assigned'
      await this.updateReportStatus(reportId, 'assigned');

      // Return the created rescue with full details
      return {
        rescue,
        report_id: reportId,
        message: 'Report claimed successfully and rescue campaign created',
      };
    } catch (error) {
      console.error('Error claiming report:', error);
      throw error;
    }
  }
}