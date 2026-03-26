import type { Request, Response, NextFunction } from 'express';
import type { ApiError } from '@sefirah/shared';
import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req: Request, res: Response) {
  const errorObj: ApiError = {
    success: false,
    statusCode: 404,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  };
  res.status(404).json(errorObj);
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('[Error]:', err);

  let statusCode = 500;
  let message = 'Internal Server Error';
  let errorName = 'ServerError';
  let details: Record<string, string[]> | undefined = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorName = err.name === 'Error' ? 'AppError' : err.name;
    message = err.message;
    details = err.details;
  } else if (err.status) {
    statusCode = err.status;
    message = err.message;
    errorName = err.name;
  }

  const errorResponse: ApiError = {
    success: false,
    statusCode,
    error: errorName,
    message,
  };

  if (details) {
    errorResponse.details = details;
  }

  res.status(statusCode).json(errorResponse);
}
