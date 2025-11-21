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
    
    // Parse coordinates and restructure reports data
    const transformedData = result.data.map((rescue: any) => {
      if (rescue.reports && Array.isArray(rescue.reports)) {
        rescue.reports = rescue.reports.map((rescueReport: any) => {
          // If reports_id is an object (the actual report data), rename it to report
          if (rescueReport.reports_id && typeof rescueReport.reports_id === 'object') {
            const reportData = rescueReport.reports_id;
            
            // Parse coordinates if needed
            if (reportData.coordinates && typeof reportData.coordinates === 'string') {
              try {
                reportData.coordinates = JSON.parse(reportData.coordinates);
              } catch (e) {
                console.warn(`Failed to parse coordinates for report ${reportData.id}`);
              }
            }
            
            return {
              ...rescueReport,
              report_id: reportData.id, // Keep the ID as report_id
              reports_id: reportData.id, // Also keep as reports_id for compatibility
              report: reportData // Add as nested report object
            };
          }
          return rescueReport;
        });
      }
      return rescue;
    });
    console.log('transformedData', transformedData);
    sendSuccess(res, transformedData, 200, { total: result.total });
  });

  getRescue = asyncHandler(async (req: Request, res: Response) => {
    const rescue = await this.rescueService.findOne(req.params.id);
    if (!rescue) {
      sendError(res, new AppError(404, 'fail', 'Rescue not found'));
      return;
    }
    
    // Parse coordinates and restructure reports data
    if (rescue.reports && Array.isArray(rescue.reports)) {
      rescue.reports = rescue.reports.map((rescueReport: any) => {
        // If reports_id is an object (the actual report data), rename it to report
        if (rescueReport.reports_id && typeof rescueReport.reports_id === 'object') {
          const reportData = rescueReport.reports_id;
          
          // Parse coordinates if needed
          if (reportData.coordinates && typeof reportData.coordinates === 'string') {
            try {
              reportData.coordinates = JSON.parse(reportData.coordinates);
            } catch (e) {
              console.warn(`Failed to parse coordinates for report ${reportData.id}`);
            }
          }
          
          return {
            ...rescueReport,
            report_id: reportData.id, // Keep the ID as report_id
            reports_id: reportData.id, // Also keep as reports_id for compatibility
            report: reportData // Add as nested report object
          };
        }
        return rescueReport;
      });
    }
    
    console.log('rescue', rescue);
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

    // Check if there are already enough participants
    const rescue = await this.rescueService.findOne(req.params.id);
    if (!rescue) {
      sendError(res, new AppError(404, 'fail', 'Rescue not found'));
      return;
    }

    const currentParticipants = rescue.participants?.length || 0;
    const requiredParticipants = rescue.required_participants || 0;

    if (currentParticipants >= requiredParticipants) {
      sendError(res, new AppError(400, 'fail', `Cannot add more participants. Maximum required participants (${requiredParticipants}) already reached.`));
      return;
    }

    const participant = await this.rescueService.addParticipant(req.params.id, users_id, role);
    sendSuccess(res, participant, 201);
  });

  // Simplified join route for authenticated users
  joinRescue = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      sendError(res, new AppError(401, 'fail', 'Authentication required'));
      return;
    }

    // Check if there are already enough participants
    const rescue = await this.rescueService.findOne(req.params.id);
    if (!rescue) {
      sendError(res, new AppError(404, 'fail', 'Rescue not found'));
      return;
    }

    const currentParticipants = rescue.participants?.length || 0;
    const requiredParticipants = rescue.required_participants || 0;

    if (requiredParticipants > 0 && currentParticipants >= requiredParticipants) {
      sendError(res, new AppError(400, 'fail', `Cannot join rescue. Maximum required participants (${requiredParticipants}) already reached.`));
      return;
    }

    const participant = await this.rescueService.addParticipant(req.params.id, userId, 'member');
    sendSuccess(res, participant, 201);
  });

  // Leave route for authenticated users
  leaveRescue = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      sendError(res, new AppError(401, 'fail', 'Authentication required'));
      return;
    }

    // Find the participant record
    const rescue = await this.rescueService.findOne(req.params.id);
    if (!rescue) {
      sendError(res, new AppError(404, 'fail', 'Rescue not found'));
      return;
    }

    const participant = rescue.participants?.find((p: any) => p.users_id === userId);
    if (!participant) {
      sendError(res, new AppError(404, 'fail', 'You are not a participant in this rescue'));
      return;
    }

    await this.rescueService.removeParticipant(participant.id);
    sendSuccess(res, { message: 'Successfully left rescue campaign' }, 200);
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
    const rescues = await this.rescueService.getUserRescues(req.params.userId);
    sendSuccess(res, rescues.data, 200, { total: rescues.total });
  });

  // Workflow actions
  startRescue = asyncHandler(async (req: Request, res: Response) => {
    const rescue = await this.rescueService.startRescue(req.params.id);
    sendSuccess(res, rescue, 200);
  });

  cancelRescue = asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body;
    const rescue = await this.rescueService.cancelRescue(req.params.id, reason);
    sendSuccess(res, rescue, 200);
  });

  updateReportProgress = asyncHandler(async (req: Request, res: Response) => {
    const { status, note } = req.body;
    const rescueReport = await this.rescueService.updateReportProgress(
      req.params.rescueReportId, 
      status, 
      note
    );
    sendSuccess(res, rescueReport, 200);
  });

  completeRescue = asyncHandler(async (req: Request, res: Response) => {
    const rescue = await this.rescueService.completeRescue(req.params.id);
    sendSuccess(res, rescue, 200);
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