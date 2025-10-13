export class AppError extends Error {
  statusCode: number;
  status: 'fail' | 'error';
  isOperational: boolean;
  
  constructor(
    statusCode: number,
    status: 'fail' | 'error',
    message: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = status;
    this.isOperational = true; // This is to operational errors
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, 'fail', message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(400, 'fail', message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'fail', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, 'fail', message);
  }
}

export class DuplicateEmailError extends AppError {
  constructor(email: string) {
    const message = `Registration failed: The email ${email} is already registered. Please use a different email address.`;
    super(409, 'fail', message);
  }
}