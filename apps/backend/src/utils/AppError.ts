export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number = 500,
    details?: Record<string, string[]>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    if (details) {
      this.details = details;
    }

    // Capture stack trace, excluding the constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}
