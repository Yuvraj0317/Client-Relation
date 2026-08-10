import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode: number = 400, code: string = 'BAD_REQUEST', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden access') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class InsufficientStockError extends AppError {
  constructor(message: string = 'Insufficient stock available') {
    super(message, 400, 'INSUFFICIENT_STOCK');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`[Error] ${req.method} ${req.url}:`, err);

  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, err.statusCode, err.code, err.details);
  }

  if (err instanceof ZodError) {
    const formattedDetails = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return ApiResponse.error(res, 'Validation failed', 422, 'VALIDATION_ERROR', formattedDetails);
  }

  return ApiResponse.error(
    res,
    err.message || 'Internal server error',
    500,
    'INTERNAL_SERVER_ERROR'
  );
};
