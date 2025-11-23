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
      // console.log('Creating adoption with data:', req.body);
      const adoption = await this.adoptionService.create(req.body);
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
      sendSuccess(res, { message: 'Adoption deleted successfully' }, 200);
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
        throw new AppError(400, 'fail', 'Status is required');
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