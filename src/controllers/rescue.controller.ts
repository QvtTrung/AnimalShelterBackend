import { Request, Response } from 'express';
import { RescueService } from '../services/rescue.service';
import { AppError } from '../utils/errors';
import { asyncHandler } from '../middleware/error.middleware';
import { sendSuccess, sendError } from '../utils/response';

export class RescueController {
  private rescueService: RescueService;

  constructor() {
    this.rescueService = new RescueService();
  }

  getAllRescues = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.rescueService.findAll(req.query);
    sendSuccess(res, result.data, 200, { total: result.total });
  });

  getRescue = asyncHandler(async (req: Request, res: Response) => {
    const rescue = await this.rescueService.findOne(req.params.id);
    if (!rescue) {
      sendError(res, new AppError(404, 'fail', 'Rescue not found'));
      return;
    }
    sendSuccess(res, rescue, 200);
  });

  createRescue = asyncHandler(async (req: Request, res: Response) => {
    const rescue = await this.rescueService.create(req.body);
    sendSuccess(res, rescue, 201);
  });

  updateRescue = asyncHandler(async (req: Request, res: Response) => {
    const rescue = await this.rescueService.update(req.params.id, req.body);
    if (!rescue) {
      sendError(res, new AppError(404, 'fail', 'Rescue not found'));
      return;
    }
    sendSuccess(res, rescue, 200);
  });

  deleteRescue = asyncHandler(async (req: Request, res: Response) => {
    await this.rescueService.delete(req.params.id);
    sendSuccess(res, { message: 'Rescue deleted successfully' }, 200);
  });

  // Participant management
  addParticipant = asyncHandler(async (req: Request, res: Response) => {
    const { users_id, role } = req.body;
    console.log ('Adding participant with users_id:', users_id, 'and role:', role);
    const participant = await this.rescueService.addParticipant(req.params.id, users_id, role);
    sendSuccess(res, participant, 201);
  });

  // updateParticipantStatus = asyncHandler(async (req: Request, res: Response) => {
  //   const { status } = req.body;
  //   const participant = await this.rescueService.updateParticipantStatus(req.params.participantId, status);
  //   sendSuccess(res, participant, 200);
  // });

  removeParticipant = asyncHandler(async (req: Request, res: Response) => {
    await this.rescueService.removeParticipant(req.params.participantId);
    sendSuccess(res, { message: 'Participant removed successfully' }, 200);
  });

  // Report management
  addReport = asyncHandler(async (req: Request, res: Response) => {
    const { reports_id } = req.body;
    const rescueReport = await this.rescueService.addReport(req.params.id, reports_id);
    sendSuccess(res, rescueReport, 201);
  });

  updateReportStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status, notes } = req.body;
    const rescueReport = await this.rescueService.updateReportStatus(req.params.rescueReportId, status, notes);
    sendSuccess(res, rescueReport, 200);
  });

  removeReport = asyncHandler(async (req: Request, res: Response) => {
    await this.rescueService.removeReport(req.params.rescueReportId);
    sendSuccess(res, { message: 'Report removed successfully' }, 200);
  });

  // User's rescues
  getUserRescues = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.rescueService.getUserRescues(req.params.userId);
    sendSuccess(res, result.data, 200, { total: result.total });
  });

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