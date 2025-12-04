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
  let errors: any[] = [];

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    status = err.status;
    message = err.message;
  }
  
  // Handle Zod validation errors
  if (err.name === 'ZodError' || err.errors) {
    statusCode = 400;
    status = 'fail';
    message = 'Validation failed';
    
    // Extract Zod error details
    if (err.errors && Array.isArray(err.errors)) {
      errors = err.errors.map((e: any) => ({
        field: e.path?.join('.') || 'unknown',
        message: e.message
      }));
      
      // Use first error message as main message
      if (errors.length > 0) {
        message = errors[0].message;
      }
    }
  }
  
  // Handle Directus errors
  if (err.errors && typeof err.errors === 'object' && !Array.isArray(err.errors)) {
    statusCode = err.statusCode || 400;
    status = 'fail';
    message = err.message || 'Directus error occurred';
  }

  // Send error response
  res.status(statusCode).json({
    status,
    message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};