import { Request, Response, NextFunction } from 'express';

interface ApiError extends Error {
  status?: number;
  message: string;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: {
      status,
      message,
    },
  });
};
