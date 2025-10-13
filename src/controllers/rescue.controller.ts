import { Request, Response, NextFunction } from 'express';
import { RescueService } from '../services/rescue.service';
import { AppError } from '../utils/errors';

export class RescueController {
  private rescueService: RescueService;

  constructor() {
    this.rescueService = new RescueService();
  }

  getAllRescues = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const rescues = await this.rescueService.findAll();
      res.json(rescues);
    } catch (error) {
      next(error);
    }
  };

  getRescue = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rescue = await this.rescueService.findOne(req.params.id);
      if (!rescue) {
        throw new AppError(404, 'fail', 'Rescue not found');
      }
      res.json(rescue);
    } catch (error) {
      next(error);
    }
  };

  createRescue = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rescue = await this.rescueService.create(req.body);
      res.status(201).json(rescue);
    } catch (error) {
      next(error);
    }
  };

  updateRescue = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rescue = await this.rescueService.update(req.params.id, req.body);
      if (!rescue) {
        throw new AppError(404, 'fail', 'Rescue not found');
      }
      res.json(rescue);
    } catch (error) {
      next(error);
    }
  };

  deleteRescue = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.rescueService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  // getUserRescues = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const rescues = await this.rescueService.getUserRescues(req.params.userId);
  //     res.json(rescues);
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  // getPetRescues = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const rescues = await this.rescueService.getPetRescues(req.params.petId);
  //     res.json(rescues);
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  // updateVeterinaryStatus = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const { veterinary_treatment_needed, treatment_details, cost_incurred } = req.body;
  //     const rescue = await this.rescueService.updateVeterinaryStatus(req.params.id, {
  //       veterinary_treatment_needed,
  //       treatment_details,
  //       cost_incurred
  //     });
  //     res.json(rescue);
  //   } catch (error) {
  //     next(error);
  //   }
  // };
}