import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { upload } from '../middleware/upload.middleware';
import { validateSchema, validateFileUpload } from '../middleware/validate.middleware';
import { validateFormData } from '../middleware/form-data.middleware';
import {
  createReportSchema,
  updateReportSchema,
  reportIdSchema,
  // reportMultipleImagesSchema,
  deleteReportImageSchema
} from '../types/validation/report.schema';

const router = Router();
const reportController = new ReportController();

// Note: Auth middleware is already applied globally in server.ts
// No need to apply it again here

// Report routes
router.get('/', reportController.getAllReports);
router.get('/me', reportController.getMyReports);
router.get('/pending', reportController.getPendingReports);
router.get('/:id', validateSchema(reportIdSchema), reportController.getReport);
router.post('/', upload.array('images', 5), validateFormData(createReportSchema), reportController.createReport);
router.patch('/:id', validateSchema(updateReportSchema), reportController.updateReport);
router.delete('/:id', validateSchema(reportIdSchema), reportController.deleteReport);

// Additional report routes
router.get('/user/:userId', reportController.getUserReports);
router.patch('/:id/status', reportController.updateReportStatus);
router.post('/:id/claim', reportController.claimReport);

// Report image routes
router.get('/:id/images', validateSchema(reportIdSchema), reportController.getReportImages);
router.post('/:id/images',
  validateSchema(reportIdSchema), // Only validate the report ID in params
  upload.array('images', 5), // Allow up to 5 images
  validateFileUpload(),
  reportController.uploadReportImages
);
router.delete('/:id/images/:imageId',
  validateSchema(deleteReportImageSchema),
  reportController.deleteReportImage);

export default router;