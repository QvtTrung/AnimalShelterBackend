import { BaseService } from './base.service';
import { DirectusReport } from '../types/directus';

export class ReportService extends BaseService<DirectusReport> {
  constructor() {
    super('reports');
  }

  async getUserReports(userId: string) {
    try {
      return await this.findAll({
        filter: {
          reporter: { _eq: userId }
        }
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateReportStatus(id: string, status: 'pending' | 'assigned' | 'resolved') {
    try {
      return await this.update(id, { status });
    } catch (error) {
      throw this.handleError(error);
    }
  }

}