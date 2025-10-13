import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';
import { ReportImageService } from '../services/report-image.service';
import { asyncHandler } from '../middleware/error.middleware';
import { sendSuccess, sendError } from '../utils/response';
import { AppError } from '../utils/errors';
import { deleteImage } from '../middleware/upload.middleware';

export class ReportController {
  private reportService: ReportService;
  private reportImageService: ReportImageService;

  constructor() {
    this.reportService = new ReportService();
    this.reportImageService = new ReportImageService();
  }

  getAllReports = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const reports = await this.reportService.findAll();
      res.json(reports);
    } catch (error) {
      next(error);
    }
  };

  getReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await this.reportService.findOne(req.params.id);
      if (!report) {
        throw new AppError(404, 'fail', 'Report not found');
      }
      res.json(report);
    } catch (error) {
      next(error);
    }
  };

  createReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];
      const imageUrls = files ? files.map(file => file.path) : [];

      const reportData = {
        ...req.body,
        images: imageUrls
      };

      const report = await this.reportService.create(reportData);
      res.status(201).json(report);
    } catch (error) {
      next(error);
    }
  };

  updateReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await this.reportService.update(req.params.id, req.body);
      if (!report) {
        throw new AppError(404, 'fail', 'Report not found');
      }
      res.json(report);
    } catch (error) {
      next(error);
    }
  };

  deleteReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await this.reportService.findOne(req.params.id);
      if (!report) {
        throw new AppError(404, 'fail', 'Report not found');
      }

      // Delete associated images
      if (report.images) {
        await Promise.all((report.images as string[]).map((imageUrl: string) => deleteImage(imageUrl)));
      }

      await this.reportService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  getUserReports = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reports = await this.reportService.getUserReports(req.params.userId);
      res.json(reports);
    } catch (error) {
      next(error);
    }
  };

  updateReportStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;
      if (!status) {
        throw new AppError(400, 'fail', 'Status is required');
      }
      const report = await this.reportService.updateReportStatus(req.params.id, status);
      res.json(report);
    } catch (error) {
      next(error);
    }
  };

  addReportImages = asyncHandler(async (req: Request, res: Response) => {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      sendError(res, new AppError(404, 'error', 'No files uploaded'));
      return;
    }

    const files = req.files as Express.Multer.File[];
    const images = [];

    for (const file of files) {
      const image = await this.reportImageService.create({
        report_id: req.params.id,
        image_url: (file as Express.Multer.File & { path: string }).path,
      });
      images.push(image);
    }

    sendSuccess(res, images, 201);
  });

  deleteReportImage = asyncHandler(async (req: Request, res: Response) => {
    const { imageId } = req.params;

    await this.reportImageService.delete(imageId);

    sendSuccess(res, { message: 'Image deleted successfully' }, 200);
  });

  getReportImages = asyncHandler(async (req: Request, res: Response) => {
    const images = await this.reportImageService.findByReportId(req.params.id);
    sendSuccess(res, images, 200);
  });
}
