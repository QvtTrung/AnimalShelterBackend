import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { upload } from '../middleware/upload.middleware';
import { validateSchema, validateFileUpload } from '../middleware/validate.middleware';
import {
  reportIdSchema,
  reportMultipleImagesSchema,
  deleteReportImageSchema
} from '../types/validation/report.schema';

const router = Router();
const reportController = new ReportController();

// Report CRUD routes
router.get('/', reportController.getAllReports);
router.get('/:id', reportController.getReport);
router.post('/', upload.array('images'), reportController.createReport);
router.patch('/:id', reportController.updateReport);
router.delete('/:id', reportController.deleteReport);

// Additional report routes
router.get('/user/:userId', reportController.getUserReports);
router.patch('/:id/status', reportController.updateReportStatus);

// Report image routes
router.get('/:id/images', validateSchema(reportIdSchema), reportController.getReportImages);
router.post('/:id/images',
  validateSchema(reportMultipleImagesSchema),
  upload.array('images', 5), // Allow up to 5 images
  validateFileUpload(),
  reportController.addReportImages
);
router.delete('/:id/images/:imageId',
  validateSchema(deleteReportImageSchema),
  reportController.deleteReportImage);

export default router;