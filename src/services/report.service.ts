import { BaseService } from './base.service';

interface Report {
  id: string;
  title: string;
  description: string;
  species: string;
  type: 'abuse' | 'abandonment' | 'injured_animal' | 'other';
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  status: 'pending' | 'assigned' | 'resolved';
  created_at?: Date;
  updated_at?: Date;
}

export class ReportService extends BaseService<Report> {
  constructor() {
    super('reports');
  }

  async getUserReports(userId: string) {
    try {
      return await this.findAll({
        filter: {
          user_created: { _eq: userId }
        }
      });
    } catch (error) {
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
}