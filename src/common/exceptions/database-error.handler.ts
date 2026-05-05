import { Injectable, Logger } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { DatabaseException, DatabaseErrorCode } from './database.exception';

enum PostgresErrorCode {
  UNIQUE_VIOLATION = '23505',
  FOREIGN_KEY_VIOLATION = '23503',
  NOT_NULL_VIOLATION = '23502',
}

@Injectable()
export class DatabaseErrorHandler {
  private readonly logger = new Logger(DatabaseErrorHandler.name);

  handleError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const code = (error.driverError as { code?: string })?.code;
      this.logger.error(`QueryFailedError code=${code}: ${error.message}`);

      switch (code) {
        case PostgresErrorCode.UNIQUE_VIOLATION:
          throw new DatabaseException(
            'Register already exists',
            DatabaseErrorCode.DUPLICATE_ENTRY,
          );
        case PostgresErrorCode.FOREIGN_KEY_VIOLATION:
          throw new DatabaseException(
            'Invalid reference',
            DatabaseErrorCode.FOREIGN_KEY_VIOLATION,
          );
        case PostgresErrorCode.NOT_NULL_VIOLATION:
          throw new DatabaseException(
            'Field required',
            DatabaseErrorCode.NULL_VIOLATION,
          );
        default:
          throw new DatabaseException(
            'Unknown database error',
            DatabaseErrorCode.DATABASE_ERROR,
          );
      }
    }

    throw new DatabaseException(
      'Database operation failed',
      DatabaseErrorCode.DATABASE_ERROR,
    );
  }
}
