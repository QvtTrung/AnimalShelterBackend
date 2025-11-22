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

    const result = await this.reportService.findAll({
      ...otherQuery,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    // Transform report_images to images and parse coordinates
    const transformedData = result.data.map((report: any) => {
      const { reports_image, coordinates, ...rest } = report;
      
      // Parse coordinates if it's a string
      let parsedCoordinates = coordinates;
      if (typeof coordinates === 'string') {
        try {
          parsedCoordinates = JSON.parse(coordinates);
        } catch (e) {
          console.warn(`Failed to parse coordinates for report ${report.id}`);
        }
      }
      
      return {
        ...rest,
        coordinates: parsedCoordinates,
        images: reports_image || [],
      };
    });

    sendSuccess(res, transformedData, 200, { total: result.total });
  });

  getReport = asyncHandler(async (req: Request, res: Response) => {
    const report = await this.reportService.findOne(req.params.id);
    if (!report) {
      sendError(res, new AppError(404, 'fail', 'Report not found'));
      return;
    }
    
    // Transform report_images to images and parse coordinates
    const { reports_image, coordinates, ...rest } = report;
    
    // Parse coordinates if it's a string
    let parsedCoordinates = coordinates;
    if (typeof coordinates === 'string') {
      try {
        parsedCoordinates = JSON.parse(coordinates);
      } catch (e) {
        console.warn(`Failed to parse coordinates for report ${report.id}`);
      }
    }
    
    const transformedReport = {
      ...rest,
      coordinates: parsedCoordinates,
      images: reports_image || [],
    };
    console.log('Transformed Report:', transformedReport);
    
    sendSuccess(res, transformedReport, 200);
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

  claimReport = asyncHandler(async (req: Request, res: Response) => {
    const reportId = req.params.id;
    
    // Get current user from directus using the token set by auth middleware
    const { readMe } = await import('@directus/sdk');
    const { directus } = await import('../config/directus');
    
    try {
      // Get the authenticated user
      const currentUser = await directus.request(readMe({
        fields: ['id']
      }));
      
      if (!currentUser || !currentUser.id) {
        sendError(res, new AppError(401, 'fail', 'Authentication required to claim report'));
        return;
      }
      
      // Get the application user ID from the directus user ID
      const { readItems } = await import('@directus/sdk');
      const appUsers = await directus.request(readItems('users', {
        filter: { directus_user_id: { _eq: currentUser.id } },
        fields: ['id'],
        limit: 1
      }));
      
      if (!appUsers || appUsers.length === 0) {
        sendError(res, new AppError(404, 'fail', 'User profile not found'));
        return;
      }
      
      const userId = appUsers[0].id;
      
      // Get the report first
      const report = await this.reportService.findOne(reportId);
      if (!report) {
        sendError(res, new AppError(404, 'fail', 'Report not found'));
        return;
      }

      // Check if report is claimable (must be pending status)
      if (report.status !== 'pending') {
        sendError(res, new AppError(400, 'fail', 'Report is not available for claiming'));
        return;
      }

      // Allow claiming of any urgency level

      // Create a rescue campaign for this report
      const rescue = await this.reportService.claimReport(reportId, userId);
      sendSuccess(res, rescue, 201);
    } catch (error: any) {
      if (error.message?.includes('Invalid user credentials') || 
          error.message?.includes('permission') ||
          error.response?.status === 401) {
        sendError(res, new AppError(401, 'fail', 'Authentication required to claim report'));
        return;
      }
      throw error;
    }
  });
}
