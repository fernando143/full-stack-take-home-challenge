import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { DatabaseException, DatabaseErrorCode } from './database.exception';

const DB_STATUS_MAP: Record<DatabaseErrorCode, HttpStatus> = {
  [DatabaseErrorCode.DUPLICATE_ENTRY]: HttpStatus.CONFLICT,
  [DatabaseErrorCode.FOREIGN_KEY_VIOLATION]: HttpStatus.BAD_REQUEST,
  [DatabaseErrorCode.NULL_VIOLATION]: HttpStatus.BAD_REQUEST,
  [DatabaseErrorCode.DATABASE_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    let statusCode: HttpStatus;
    let message: string | string[];
    let code: string;

    if (exception instanceof DatabaseException) {
      statusCode = DB_STATUS_MAP[exception.code];
      message = exception.message;
      code = exception.code;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      message = typeof body === 'string' ? body : (body as any).message;
      code = HttpStatus[statusCode];
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      code = 'INTERNAL_SERVER_ERROR';
      this.logger.error(exception);
    }

    response.status(statusCode).json({
      statusCode,
      message,
      code,
      timestamp: new Date().toISOString(),
    });
  }
}
