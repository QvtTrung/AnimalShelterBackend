import { Request, Response } from 'express';
import { ReportService } from '../services/report.service';
import { ReportImageService } from '../services/report-image.service';
import { asyncHandler } from '../middleware/error.middleware';
import { sendSuccess, sendError } from '../utils/response';
import { AppError } from '../utils/errors';

export class ReportController {
  private reportService: ReportService;
  private reportImageService: ReportImageService;

  constructor() {
    this.reportService = new ReportService();
    this.reportImageService = new ReportImageService();
  }

  getAllReports = asyncHandler(async (req: Request, res: Response) => {
    // Handle pagination parameters
    const { page = 1, limit = 10, offset = 0, ...otherQuery } = req.query;

    // console.log("Request query:", req.query);

    const result = await this.reportService.findAll({
      ...otherQuery,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    // console.log("Retrieved reports:", result);
    sendSuccess(res, result.data, 200, { total: result.total });
  });

  getReport = asyncHandler(async (req: Request, res: Response) => {
    const report = await this.reportService.findOne(req.params.id);
    if (!report) {
      sendError(res, new AppError(404, 'fail', 'Report not found'));
      return;
    }
    sendSuccess(res, report, 200);
  });

  createReport = asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];

    // If the request is form-data, the body might be flattened
    // So we need to handle both cases
    let reportData = req.body || {};

    // If req.body is a string (JSON string), parse it
    if (typeof req.body === 'string') {
      try {
        reportData = JSON.parse(req.body);
      } catch (e) {
        reportData = {};
      }
    }

    // If req.body is already flattened (from form-data), use it as is
    // If it's nested under 'body', extract it
    if (req.body && req.body.body && typeof req.body.body === 'object') {
      reportData = req.body.body;
    } else if (req.body && !req.body.body) {
      // If the body is flattened but doesn't have a nested body property
      // it might be from form-data middleware
      reportData = req.body;
    }

    // Remove images from reportData if they exist
    if (reportData && reportData.images) {
      delete reportData.images;
    }

    // Ensure reportData is a proper object
    if (typeof reportData !== 'object' || reportData === null) {
      reportData = {};
    }

    const report = await this.reportService.create(reportData);

    // Create image records if files were uploaded
    if (files && files.length > 0) {
      for (const file of files) {
        await this.reportImageService.create({
          report_id: report.id,
          image_url: file.path
        });
      }
    }

    // Fetch the report with its images
    const reportWithImages = await this.reportService.findOne(report.id);
    sendSuccess(res, reportWithImages, 201);
  });

  updateReport = asyncHandler(async (req: Request, res: Response) => {
    const report = await this.reportService.update(req.params.id, req.body);
    sendSuccess(res, report, 200);
  });

  deleteReport = asyncHandler(async (req: Request, res: Response) => {
    // First delete all report images
    const images = await this.reportImageService.findByReportId(req.params.id);
    if (images && Array.isArray(images)) {
      for (const image of images) {
        await this.reportImageService.delete(image.id);
      }
    }

    await this.reportService.delete(req.params.id);
    sendSuccess(res, { message: 'Report deleted successfully' }, 200);
  });

  getUserReports = asyncHandler(async (req: Request, res: Response) => {
    const reports = await this.reportService.getUserReports(req.params.userId);
    sendSuccess(res, reports.data, 200, { total: reports.total });
  });

  getPendingReports = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.reportService.findPending(req.query);
    sendSuccess(res, result.data, 200, { total: result.total });
  });

  updateReportStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;
    if (!status) {
      sendError(res, new AppError(400, 'fail', 'Status is required'));
      return;
    }
    const report = await this.reportService.updateReportStatus(req.params.id, status);
    sendSuccess(res, report, 200);
  });

  uploadReportImages = asyncHandler(async (req: Request, res: Response) => {
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
    await this.reportImageService.delete(req.params.imageId);
    sendSuccess(res, { message: 'Image deleted successfully' }, 200);
  });

  getReportImages = asyncHandler(async (req: Request, res: Response) => {
    const images = await this.reportImageService.findByReportId(req.params.id);
    sendSuccess(res, images, 200);
  });
}
