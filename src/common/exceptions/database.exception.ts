export enum DatabaseErrorCode {
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION',
  NULL_VIOLATION = 'NULL_VIOLATION',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

export class DatabaseException extends Error {
  constructor(
    message: string,
    public readonly code: DatabaseErrorCode,
  ) {
    super(message);
    this.name = 'DatabaseException';
  }
}
