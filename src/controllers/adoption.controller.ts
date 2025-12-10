import { Request, Response, NextFunction } from 'express';
import { AdoptionService } from '../services/adoption.service';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export class AdoptionController {
  private adoptionService: AdoptionService;

  constructor() {
    this.adoptionService = new AdoptionService();
  }

  getAllAdoptions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Handle pagination parameters and fields
      const { page = 1, limit = 10, offset = 0, fields, ...otherQuery } = req.query;

      const result = await this.adoptionService.findAll({
        ...otherQuery,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        fields: fields ? (fields as string).split(',') : undefined,
      });

      // console.log("Retrieved adoptions:", result);
      sendSuccess(res, result.data, 200, { total: result.total });
    } catch (error) {
      next(error);
    }
  };

  getAdoption = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fields = req.query.fields as string | undefined;
      const adoption = await this.adoptionService.findOne(
        req.params.id, 
        fields ? fields.split(',') : undefined
      );
      if (!adoption) {
        throw new AppError(404, 'fail', 'Adoption not found');
      }
      sendSuccess(res, adoption, 200);
    } catch (error) {
      next(error);
    }
  };

  createAdoption = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get authenticated user from Directus
      const { readMe } = await import('@directus/sdk');
      const { directus } = await import('../config/directus');
      
      const currentUser = await directus.request(readMe({ fields: ['id'] }));
      
      if (!currentUser || !currentUser.id) {
        throw new AppError(401, 'fail', 'Yêu cầu đăng nhập');
      }

      // Attach user_id from authenticated user if not provided
      const adoptionData = {
        ...req.body,
        user_id: req.body.user_id || currentUser.id
      };

      // console.log('Creating adoption with data:', adoptionData);
      const adoption = await this.adoptionService.create(adoptionData);
      sendSuccess(res, adoption, 201);
    } catch (error) {
      next(error);
    }
  };

  updateAdoption = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adoption = await this.adoptionService.update(req.params.id, req.body);
      if (!adoption) {
        throw new AppError(404, 'fail', 'Adoption not found');
      }
      sendSuccess(res, adoption, 200);
    } catch (error) {
      next(error);
    }
  };

  deleteAdoption = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.adoptionService.delete(req.params.id);
      sendSuccess(res, { message: 'Xóa đơn xin nhận nuôi thành công' }, 200);
    } catch (error) {
      next(error);
    }
  };

  getUserAdoptions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adoptions = await this.adoptionService.getUserAdoptions(req.params.userId);
      sendSuccess(res, adoptions.data, 200, { total: adoptions.total });
    } catch (error) {
      next(error);
    }
  };

  getMyAdoptions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get current authenticated user ID from directus
      const { readMe, readItems } = await import('@directus/sdk');
      const { directus } = await import('../config/directus');
      
      const currentUser = await directus.request(readMe({ fields: ['id'] }));
      
      if (!currentUser || !currentUser.id) {
        throw new AppError(401, 'fail', 'Yêu cầu đăng nhập');
      }
      
      // Get the application user ID from directus user ID
      const appUsers = await directus.request(readItems('users', {
        filter: { directus_user_id: { _eq: currentUser.id } },
        fields: ['id'],
        limit: 1
      }));
      
      if (!appUsers || appUsers.length === 0) {
        throw new AppError(404, 'fail', 'Không tìm thấy hồ sơ người dùng');
      }
      
      const userId = appUsers[0].id;
      const adoptions = await this.adoptionService.getUserAdoptions(userId);
      sendSuccess(res, adoptions.data, 200, { total: adoptions.total });
    } catch (error) {
      next(error);
    }
  };

  getPetAdoptions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adoptions = await this.adoptionService.getPetAdoptions(req.params.petId);
      sendSuccess(res, adoptions.data, 200, { total: adoptions.total });
    } catch (error) {
      next(error);
    }
  };

  updateAdoptionStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;
      if (!status) {
        throw new AppError(400, 'fail', 'Trạng thái là bắt buộc');
      }
      const adoption = await this.adoptionService.updateAdoptionStatus(req.params.id, status);
      sendSuccess(res, adoption, 200);
    } catch (error) {
      next(error);
    }
  };

  // Send confirmation request
  sendConfirmation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adoption = await this.adoptionService.sendConfirmationRequest(req.params.id);
      sendSuccess(res, adoption, 200);
    } catch (error) {
      next(error);
    }
  };

  // User confirms adoption
  confirmAdoption = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adoption = await this.adoptionService.confirmAdoption(req.params.id);
      sendSuccess(res, adoption, 200);
    } catch (error) {
      next(error);
    }
  };

  // Cancel adoption
  cancelAdoption = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adoption = await this.adoptionService.cancelAdoption(req.params.id, false);
      sendSuccess(res, adoption, 200);
    } catch (error) {
      next(error);
    }
  };

  // Complete adoption (admin action)
  completeAdoption = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adoption = await this.adoptionService.completeAdoption(req.params.id);
      sendSuccess(res, adoption, 200);
    } catch (error) {
      next(error);
    }
  };

  // Auto-cancel expired confirmations (can be called by cron job)
  autoCancelExpired = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adoptionService.autoCancelExpiredConfirmations();
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };
}