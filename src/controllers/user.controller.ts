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
    // Handle pagination parameters
    const { page = 1, limit = 10, offset = 0, ...otherQuery } = req.query;

    // console.log("Request query:", req.query);

    const result = await this.userService.findAllWithRoles({
      ...otherQuery,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    // console.log("Retrieved users:", result);
    sendSuccess(res, result.data, 200, { total: result.total });
  });

  getUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.findOneWithRole(req.params.id);
    if (!user) {
      sendError(res, new AppError(404, 'fail', 'User not found'));
      return;
    }
    sendSuccess(res, user, 200);
  });

  createUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.createUserWithPassword(req.body);
    // Don't return the password in the response
    const { password, ...userWithoutPassword } = user as any;
    // Fetch the user with role information
    const userWithRole = await this.userService.findOneWithRole(user.id);
    sendSuccess(res, userWithRole, 201);
  });

  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.updateUserProfile(req.params.id, req.body);
    // Fetch the user with role information
    const userWithRole = await this.userService.findOneWithRole(req.params.id);
    sendSuccess(res, userWithRole, 200);
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
