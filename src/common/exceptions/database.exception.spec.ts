import { DatabaseException, DatabaseErrorCode } from './database.exception';

describe('DatabaseException', () => {
  it('sets message, code, and name correctly', () => {
    const exception = new DatabaseException(
      'Register already exists',
      DatabaseErrorCode.DUPLICATE_ENTRY,
    );

    expect(exception.message).toBe('Register already exists');
    expect(exception.code).toBe(DatabaseErrorCode.DUPLICATE_ENTRY);
    expect(exception.name).toBe('DatabaseException');
    expect(exception).toBeInstanceOf(Error);
  });
});
