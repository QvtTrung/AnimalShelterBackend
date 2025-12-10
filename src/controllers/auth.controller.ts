import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../middleware/error.middleware';
import { sendSuccess, sendError } from '../utils/response';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Input validation is handled by middleware

    const result = await this.authService.login(email, password);
    sendSuccess(res, result, 200);
  });

  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, first_name, last_name} = req.body;

    // Input validation is handled by middleware

    const result = await this.authService.register({
      email,
      password,
      first_name,
      last_name,
    });

    sendSuccess(res, result, 201);
  });

  getCurrentUser = asyncHandler(async (_req: Request, res: Response) => {
    try {
      const currentUserData = await this.authService.getCurrentUser();
      sendSuccess(res, currentUserData, 200);
    } catch (error) {
      return sendError(res, error);
    }
  });

  logout = asyncHandler(async (_req: Request, res: Response) => {
    try {
      await this.authService.logout();
      sendSuccess(res, { timestamp: new Date().toISOString() }, 200);
    } catch (error) {
      return sendError(res, error);
    }
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { refresh_token } = req.body;
      const result = await this.authService.refreshToken(refresh_token);
      sendSuccess(res, result, 200);
    } catch (error) {
      return sendError(res, error);
    }
  });

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { current_password, new_password } = req.body;
      await this.authService.changePassword(current_password, new_password);
      sendSuccess(res, { message: 'Password changed successfully' }, 200);
    } catch (error) {
      return sendError(res, error);
    }
  });
}