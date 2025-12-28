import { NextFunction, Request, Response } from 'express';
import { Logger } from 'scheduler-node-models/general';

export function notFound(req: Request, res: Response, next: NextFunction) {
  res.status(404);
  const error = new Error(`* Not Found - ${req.originalUrl}`);
  next(error);
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  const statusCode = res.statusCode != 200 ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '' : err.stack,
  });
  if (statusCode > 299) {
    const logger = new Logger(`${process.env.LOG_DIR}/authentication-error.log`);
    logger.log(`${statusCode} - ${err.message}`);
    logger.stop();
  }
}