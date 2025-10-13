import { BaseService } from './base.service';
import { deleteImage } from '../middleware/upload.middleware';

interface ReportImage {
  id: string;
  report_id: string;
  image_url: string;
  created_at?: Date;
  updated_at?: Date;
}

export class ReportImageService extends BaseService<ReportImage> {
  constructor() {
    super('reports_images');
  }

  async delete(id: string) {
    try {
      const image = await this.findOne(id);
      if (image?.image_url) {
        // Extract public_id from Cloudinary URL
        const publicId = image.image_url.split('/').pop()?.split('.')[0];
        if (publicId) {
          await deleteImage(publicId);
        }
      }
      return await super.delete(id);
    } catch (error) {
      throw error;
    }
  }

  async findByReportId(reportId: string) {
    try {
      return await this.findAll({
        filter: { report_id: { _eq: reportId } },
      });
    } catch (error) {
      throw error;
    }
  }
}