import { Request, Response, NextFunction } from 'express';
import { AdoptionService } from '../services/adoption.service';
import { AppError } from '../utils/errors';

export class AdoptionController {
  private adoptionService: AdoptionService;

  constructor() {
    this.adoptionService = new AdoptionService();
  }

  getAllAdoptions = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const adoptions = await this.adoptionService.findAll();
      res.json(adoptions);
    } catch (error) {
      next(error);
    }
  };

  getAdoption = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adoption = await this.adoptionService.findOne(req.params.id);
      if (!adoption) {
        throw new AppError(404, 'fail', 'Adoption not found');
      }
      res.json(adoption);
    } catch (error) {
      next(error);
    }
  };

  createAdoption = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adoption = await this.adoptionService.create(req.body);
      res.status(201).json(adoption);
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
      res.json(adoption);
    } catch (error) {
      next(error);
    }
  };

  deleteAdoption = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.adoptionService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  getUserAdoptions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adoptions = await this.adoptionService.getUserAdoptions(req.params.userId);
      res.json(adoptions);
    } catch (error) {
      next(error);
    }
  };

  getPetAdoptions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adoptions = await this.adoptionService.getPetAdoptions(req.params.petId);
      res.json(adoptions);
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
      res.json(adoption);
    } catch (error) {
      next(error);
    }
  };
}