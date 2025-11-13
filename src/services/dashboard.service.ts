import { BaseService } from './base.service';
import { readItems } from '@directus/sdk';

export class DashboardService extends BaseService<any> {
  constructor() {
    super('dashboard'); // placeholder collection
  }

  /**
   * Get dashboard analytics
   */
  async getDashboardAnalytics(_userId?: string) {
    try {
      // Get counts for various entities
      const reportsCount = await this.getReportsCount();
      const rescuesCount = await this.getRescuesCount();
      const adoptionsCount = await this.getAdoptionsCount();
      const petsCount = await this.getPetsCount();

      // Get recent activities
      const recentReports = await this.getRecentReports(5);
      const recentRescues = await this.getRecentRescues(5);
      const recentAdoptions = await this.getRecentAdoptions(5);

      // Get map data (pending reports and in-progress rescues)
      const pendingReports = await this.getPendingReports();
      const inProgressRescues = await this.getInProgressRescues();

      return {
        stats: {
          reports: reportsCount,
          rescues: rescuesCount,
          adoptions: adoptionsCount,
          pets: petsCount,
        },
        recent: {
          reports: recentReports,
          rescues: recentRescues,
          adoptions: recentAdoptions,
        },
        map: {
          pendingReports,
          inProgressRescues,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get total reports count with status breakdown
   */
  private async getReportsCount() {
    try {
      const allReports = await this.sdk.request(
        readItems('reports', {
          limit: -1,
          fields: ['id', 'status'],
        })
      );

      const total = allReports?.length || 0;
      const pending = allReports?.filter((r: any) => r.status === 'pending').length || 0;
      const assigned = allReports?.filter((r: any) => r.status === 'assigned').length || 0;
      const resolved = allReports?.filter((r: any) => r.status === 'resolved').length || 0;

      return { total, pending, assigned, resolved };
    } catch (error) {
      console.error('Error getting reports count:', error);
      return { total: 0, pending: 0, assigned: 0, resolved: 0 };
    }
  }

  /**
   * Get total rescues count with status breakdown
   */
  private async getRescuesCount() {
    try {
      const allRescues = await this.sdk.request(
        readItems('rescues', {
          limit: -1,
          fields: ['id', 'status'],
        })
      );

      const total = allRescues?.length || 0;
      const in_progress = allRescues?.filter((r: any) => r.status === 'in_progress').length || 0;
      const success = allRescues?.filter((r: any) => r.status === 'success').length || 0;
      const cancelled = allRescues?.filter((r: any) => r.status === 'cancelled').length || 0;

      return { total, in_progress, success, cancelled };
    } catch (error) {
      console.error('Error getting rescues count:', error);
      return { total: 0, in_progress: 0, success: 0, cancelled: 0 };
    }
  }

  /**
   * Get total adoptions count with status breakdown
   */
  private async getAdoptionsCount() {
    try {
      const allAdoptions = await this.sdk.request(
        readItems('adoptions', {
          limit: -1,
          fields: ['id', 'status'],
        })
      );

      const total = allAdoptions?.length || 0;
      const pending = allAdoptions?.filter((a: any) => a.status === 'pending').length || 0;
      const confirming = allAdoptions?.filter((a: any) => a.status === 'confirming').length || 0;
      const confirmed = allAdoptions?.filter((a: any) => a.status === 'confirmed').length || 0;
      const completed = allAdoptions?.filter((a: any) => a.status === 'completed').length || 0;
      const cancelled = allAdoptions?.filter((a: any) => a.status === 'cancelled').length || 0;

      return { total, pending, confirming, confirmed, completed, cancelled };
    } catch (error) {
      console.error('Error getting adoptions count:', error);
      return { total: 0, pending: 0, confirming: 0, confirmed: 0, completed: 0, cancelled: 0 };
    }
  }

  /**
   * Get total pets count
   */
  private async getPetsCount() {
    try {
      const allPets = await this.sdk.request(
        readItems('pets', {
          limit: -1,
          fields: ['id', 'status'],
        })
      );

      const total = allPets?.length || 0;
      const available = allPets?.filter((p: any) => p.status === 'available').length || 0;
      const adopted = allPets?.filter((p: any) => p.status === 'adopted').length || 0;

      return { total, available, adopted };
    } catch (error) {
      console.error('Error getting pets count:', error);
      const errorTotal = 0;
      return { total: errorTotal, available: 0, adopted: 0 };
    }
  }

  /**
   * Get recent reports
   */
  private async getRecentReports(limit: number = 5) {
    try {
      const reports = await this.sdk.request(
        readItems('reports', {
          limit,
          sort: ['-date_created'],
          fields: ['id', 'title', 'status', 'urgency_level', 'date_created'],
        })
      );

      return reports || [];
    } catch (error) {
      console.error('Error getting recent reports:', error);
      return [];
    }
  }

  /**
   * Get recent rescues
   */
  private async getRecentRescues(limit: number = 5) {
    try {
      const rescues = await this.sdk.request(
        readItems('rescues', {
          limit,
          sort: ['-date_created'],
          fields: ['id', 'title', 'status', 'date_created'],
        })
      );

      return rescues || [];
    } catch (error) {
      console.error('Error getting recent rescues:', error);
      return [];
    }
  }

  /**
   * Get recent adoptions
   */
  private async getRecentAdoptions(limit: number = 5) {
    try {
      const adoptions = await this.sdk.request(
        readItems('adoptions', {
          limit,
          sort: ['-date_created'],
          fields: ['id', 'status', 'date_created', 'pet_id'],
        })
      );

      return adoptions || [];
    } catch (error) {
      console.error('Error getting recent adoptions:', error);
      return [];
    }
  }

  /**
   * Get pending reports for map display
   */
  private async getPendingReports() {
    try {
      const reports = await this.sdk.request(
        readItems('reports', {
          filter: {
            status: {
              _in: ['pending', 'assigned'],
            },
          },
          fields: [
            'id',
            'title',
            'description',
            'status',
            'urgency_level',
            'location',
            'coordinates',
            'date_created',
          ],
        })
      );

      return reports || [];
    } catch (error) {
      console.error('Error getting pending reports:', error);
      return [];
    }
  }

  /**
   * Get in-progress rescues for map display
   */
  private async getInProgressRescues() {
    try {
      const rescues = await this.sdk.request(
        readItems('rescues', {
          filter: {
            status: {
              _eq: 'in_progress',
            },
          },
          fields: ['id', 'title', 'description', 'status', 'date_created'],
        })
      );

      // For each rescue, get associated reports with coordinates
      const rescuesWithReports = await Promise.all(
        (rescues || []).map(async (rescue: any) => {
          const rescueReports = await this.sdk.request(
            readItems('rescues_reports', {
              filter: {
                rescues_id: {
                  _eq: rescue.id,
                },
              },
              fields: ['reports_id'],
            })
          );

          const reportIds = rescueReports?.map((rr: any) => rr.reports_id) || [];

          if (reportIds.length > 0) {
            const reports = await this.sdk.request(
              readItems('reports', {
                filter: {
                  id: {
                    _in: reportIds,
                  },
                },
                fields: ['id', 'title', 'location', 'coordinates'],
              })
            );

            return {
              ...rescue,
              reports: reports || [],
            };
          }

          return {
            ...rescue,
            reports: [],
          };
        })
      );

      return rescuesWithReports;
    } catch (error) {
      console.error('Error getting in-progress rescues:', error);
      return [];
    }
  }
}
