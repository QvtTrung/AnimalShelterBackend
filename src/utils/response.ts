import { Response } from 'express';
import { AppError } from './errors';

// Standard success response structure
export interface SuccessResponse<T = any> {
  status: 'success';
  message: string;
  data?: T;
  statusCode: number;
}

// Standard error response structure
export interface ErrorResponse {
  status: 'fail' | 'error';
  message: string;
  timestamp: string;
  statusCode: number;
  errorType?: string;
  isOperational?: boolean;
}

// API response structure that can be either success or error
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Helper function to create success responses
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): SuccessResponse<T> {
  return {
    status: 'success',
    message: message || 'Operation successful',
    data,
    statusCode,
  };
}

// Helper function to create error responses
export function createErrorResponse(
  error: AppError | Error,
  statusCode: number = error instanceof AppError ? error.statusCode : 500,
  status: 'fail' | 'error' = error instanceof AppError ? error.status : 'error'
): ErrorResponse {
  const response: ErrorResponse = {
    status,
    message: error.message,
    timestamp: new Date().toISOString(),
    statusCode,
  };

  // Add AppError specific properties if applicable
  if (error instanceof AppError) {
    response.errorType = error.name;
    response.isOperational = error.isOperational;
  }

  return response;
}

// Helper function to send API responses
export function sendResponse<T>(
  res: Response,
  response: ApiResponse<T>,
  statusCode: number = response.status === 'success' ? 200 : 500
): void {
  res.status(statusCode).json(response);
}

// Helper function to send success responses
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200
): void {
  const response = createSuccessResponse(data, undefined, statusCode);
  sendResponse(res, response, statusCode);
}

// Helper function to send error responses
export function sendError(
  res: Response,
  error: AppError | Error,
  statusCode: number = error instanceof AppError ? error.statusCode : 500
): void {
  const response = createErrorResponse(error, statusCode);
  sendResponse(res, response, statusCode);
}