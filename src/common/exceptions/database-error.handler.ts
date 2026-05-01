import { Injectable, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { DatabaseException } from './database.exception';

enum PostgresErrorCode {
  UNIQUE_VIOLATION = '23505',
  FOREIGN_KEY_VIOLATION = '23503',
  NOT_NULL_VIOLATION = '23502',
}

@Injectable()
export class DatabaseErrorHandler {
  handleError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const code = (error.driverError as { code?: string })?.code;

      switch (code) {
        case PostgresErrorCode.UNIQUE_VIOLATION:
          throw new DatabaseException(
            'Register already exists',
            'DUPLICATE_ENTRY',
            HttpStatus.CONFLICT,
          );
        case PostgresErrorCode.FOREIGN_KEY_VIOLATION:
          throw new DatabaseException(
            'Invalid reference',
            'FOREIGN_KEY_VIOLATION',
            HttpStatus.BAD_REQUEST,
          );
        case PostgresErrorCode.NOT_NULL_VIOLATION:
          throw new DatabaseException(
            'Field required',
            'NULL_VIOLATION',
            HttpStatus.BAD_REQUEST,
          );
        default:
          throw new DatabaseException('Unknown DB error', 'DATABASE_ERROR');
      }
    }
    throw error;
  }
}
