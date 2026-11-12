import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { env } from '../env';

/**
 * Catches everything. Known HttpExceptions pass through with their status; any
 * unexpected error is logged server-side and returned as a generic 500 so we
 * never leak a stack trace or take the process down over one bad request.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly log = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      res.status(status).json(exception.getResponse());
      return;
    }

    // Unexpected — log the real error, return a safe message.
    this.log.error(`Unhandled error on ${req.method} ${req.url}: ${String((exception as any)?.stack || exception)}`);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      message: env.NODE_ENV === 'production' ? 'Internal server error' : String((exception as any)?.message || exception),
    });
  }
}
