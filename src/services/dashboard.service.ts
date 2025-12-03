import { BaseService } from './base.service';
import { readItems } from '@directus/sdk';

export class DashboardService extends BaseService<any> {
  constructor() {
    super('dashboard'); // placeholder collection
  }

  /**
   * Get user-specific dashboard stats
   */
  async getUserStats(userId: string) {
    try {
      // Get user's adoptions with status breakdown
      const userAdoptions = await this.sdk.request(
        readItems('adoptions', {
          filter: { user_id: { _eq: userId } },
          fields: ['id', 'status'],
          limit: -1,
        })
      );

      const adoptions = {
        total: userAdoptions?.length || 0,
        pending: userAdoptions?.filter((a: any) => a.status === 'pending').length || 0,
        approved: userAdoptions?.filter((a: any) => a.status === 'approved' || a.status === 'confirmed').length || 0,
        completed: userAdoptions?.filter((a: any) => a.status === 'completed').length || 0,
      };

      // Get user's reports with status breakdown
      const userReports = await this.sdk.request(
        readItems('reports', {
          filter: { user_created: { _eq: userId } },
          fields: ['id', 'status'],
          limit: -1,
        })
      );

      const reports = {
        total: userReports?.length || 0,
        pending: userReports?.filter((r: any) => r.status === 'pending').length || 0,
        assigned: userReports?.filter((r: any) => r.status === 'assigned').length || 0,
        resolved: userReports?.filter((r: any) => r.status === 'resolved').length || 0,
      };

      // Get user's rescues (where user is a participant)
      const userRescueParticipations = await this.sdk.request(
        readItems('rescues_users', {
          filter: { users_id: { _eq: userId } },
          fields: ['rescues_id'],
          limit: -1,
        })
      );

      const rescueIds = userRescueParticipations?.map((rp: any) => {
        return typeof rp.rescues_id === 'object' ? rp.rescues_id.id : rp.rescues_id;
      }) || [];

      let rescues = {
        total: 0,
        planned: 0,
        in_progress: 0,
        completed: 0,
      };

      if (rescueIds.length > 0) {
        const userRescues = await this.sdk.request(
          readItems('rescues', {
            filter: { id: { _in: rescueIds } },
            fields: ['id', 'status'],
            limit: -1,
          })
        );

        rescues = {
          total: userRescues?.length || 0,
          planned: userRescues?.filter((r: any) => r.status === 'planned').length || 0,
          in_progress: userRescues?.filter((r: any) => r.status === 'in_progress').length || 0,
          completed: userRescues?.filter((r: any) => r.status === 'completed').length || 0,
        };
      }

      return {
        adoptions,
        reports,
        rescues,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Get user's recent activity
   */
  async getUserActivity(userId: string, limit: number = 10) {
    try {
      const activities: any[] = [];

      // Get recent adoptions
      const recentAdoptions = await this.sdk.request(
        readItems('adoptions', {
          filter: { user_id: { _eq: userId } },
          fields: ['id', 'status', 'date_created', 'pet_id'],
          sort: ['-date_created'],
          limit: limit,
        })
      );

      recentAdoptions?.forEach((adoption: any) => {
        activities.push({
          id: adoption.id,
          type: 'adoption',
          title: 'Adoption Application',
          description: `Applied for pet adoption`,
          date: adoption.date_created,
          status: adoption.status,
        });
      });

      // Get recent reports
      const recentReports = await this.sdk.request(
        readItems('reports', {
          filter: { user_created: { _eq: userId } },
          fields: ['id', 'title', 'status', 'date_created'],
          sort: ['-date_created'],
          limit: limit,
        })
      );

      recentReports?.forEach((report: any) => {
        activities.push({
          id: report.id,
          type: 'report',
          title: report.title || 'Animal Report',
          description: 'Submitted a report',
          date: report.date_created,
          status: report.status,
        });
      });

      // Get recent rescues
      const userRescueParticipations = await this.sdk.request(
        readItems('rescues_users', {
          filter: { users_id: { _eq: userId } },
          fields: ['rescues_id', 'date_created'],
          sort: ['-date_created'],
          limit: limit,
        })
      );

      const rescueIds = userRescueParticipations?.map((rp: any) => {
        return typeof rp.rescues_id === 'object' ? rp.rescues_id.id : rp.rescues_id;
      }) || [];

      if (rescueIds.length > 0) {
        const userRescues = await this.sdk.request(
          readItems('rescues', {
            filter: { id: { _in: rescueIds } },
            fields: ['id', 'title', 'status', 'date_created'],
          })
        );

        userRescues?.forEach((rescue: any) => {
          activities.push({
            id: rescue.id,
            type: 'rescue',
            title: rescue.title,
            description: 'Joined rescue campaign',
            date: rescue.date_created,
            status: rescue.status,
          });
        });
      }

      // Sort all activities by date
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Return top activities
      return activities.slice(0, limit);
    } catch (error) {
      console.error('Error getting user activity:', error);
      throw error;
    }
  }

  /**
   * Get nearby reports based on user coordinates
   */
  async getNearbyReports(userLat: number, userLng: number, radiusMeters: number = 25000) {
    try {
      // Get all pending and assigned reports with coordinates
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
            'species',
            'type',
            'status',
            'urgency_level',
            'location',
            'coordinates',
            'date_created',
            'reports_image.id',
            'reports_image.image_url',
          ],
        })
      );

      // Calculate distances and filter by radius
      const reportsWithDistance = reports
        ?.map((report: any) => {
          // Parse coordinates if they're stored as string
          let coords = report.coordinates;
          if (typeof coords === 'string') {
            try {
              coords = JSON.parse(coords);
            } catch (e) {
              return null;
            }
          }

          if (!coords || !coords.coordinates || coords.coordinates.length !== 2) {
            return null;
          }

          const [reportLng, reportLat] = coords.coordinates;

          // Calculate distance using Haversine formula
          const distance = this.calculateDistance(userLat, userLng, reportLat, reportLng);

          if (distance <= radiusMeters) {
            return {
              ...report,
              distance_meters: Math.round(distance),
              distance_km: (distance / 1000).toFixed(2),
              images: report.reports_image || [],
            };
          }

          return null;
        })
        .filter((report: any) => report !== null)
        .sort((a: any, b: any) => a.distance_meters - b.distance_meters) || [];

      return reportsWithDistance;
    } catch (error) {
      console.error('Error getting nearby reports:', error);
      throw error;
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in meters
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
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
      const recentReports = await this.getRecentReports(10);
      const recentRescues = await this.getRecentRescues(10);
      const recentAdoptions = await this.getRecentAdoptions(10);

      // Get map data (pending reports and all rescues with their reports)
      const pendingReports = await this.getPendingReports();
      const allRescues = await this.getAllRescues();

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
          allRescues,
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

  /**
   * Get all rescues with their associated reports and coordinates
   */
  private async getAllRescues() {
    try {
      const rescues = await this.sdk.request(
        readItems('rescues', {
          fields: ['id', 'title', 'description', 'status', 'date_created'],
          sort: ['-date_created'],
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
      console.error('Error getting all rescues:', error);
      return [];
    }
  }
}
