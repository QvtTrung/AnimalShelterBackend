import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { asyncHandler } from '../middleware/error.middleware';
import { sendSuccess, sendError } from '../utils/response';
import { AppError } from '../utils/errors';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.userService.findAll(req.query);
    sendSuccess(res, result.data, 200, { total: result.total });
  });

  getUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.findOne(req.params.id);
    if (!user) {
      sendError(res, new AppError(404, 'fail', 'User not found'));
      return;
    }
    sendSuccess(res, user, 200);
  });

  createUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.create(req.body);
    // Don't return the password in the response
    const { password, ...userWithoutPassword } = user as any;
    sendSuccess(res, userWithoutPassword, 201);
  });

  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.updateUserProfile(req.params.id, req.body);
    sendSuccess(res, user, 200);
  });

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    await this.userService.delete(req.params.id);
    sendSuccess(res, { message: 'User deleted successfully' }, 200);
  });

  getUserByEmail = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.findByEmail(req.params.email);
    if (!user) {
      sendError(res, new AppError(404, 'fail', 'User not found'));
      return;
    }
    sendSuccess(res, user, 200);
  });

  getUserByDirectusId = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.findByDirectusUserId(req.params.directusUserId);
    if (!user) {
      sendError(res, new AppError(404, 'fail', 'User not found'));
      return;
    }
    sendSuccess(res, user, 200);
  });
}
