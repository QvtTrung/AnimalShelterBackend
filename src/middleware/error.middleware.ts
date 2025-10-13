import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error caught by middleware:', err);

  // Set default values
  let statusCode = err.statusCode || 500;
  let status = err.status || 'error';
  let message = err.message || 'Something went wrong!';

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    status = err.status;
    message = err.message;
  }

  // Send error response
  res.status(statusCode).json({
    status,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};