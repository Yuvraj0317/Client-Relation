import { Response } from 'express';

export interface Meta {
  page?: number;
  limit?: number;
  total?: number;
  [key: string]: any;
}

export class ApiResponse {
  static success<T>(res: Response, data: T, meta?: Meta, statusCode: number = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
      ...(meta && { meta })
    });
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 400,
    code?: string,
    details?: any
  ) {
    return res.status(statusCode).json({
      success: false,
      error: {
        code: code || 'BAD_REQUEST',
        message,
        ...(details && { details })
      }
    });
  }
}
