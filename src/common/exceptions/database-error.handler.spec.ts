import { Test, TestingModule } from '@nestjs/testing';
import { QueryFailedError } from 'typeorm';
import { DatabaseErrorHandler } from './database-error.handler';
import { DatabaseErrorCode } from './database.exception';

const makeQueryFailedError = (pgCode: string): QueryFailedError => {
  const err = Object.create(QueryFailedError.prototype) as QueryFailedError;
  (err as any).driverError = { code: pgCode };
  err.message = 'query failed';
  return err;
};

describe('DatabaseErrorHandler', () => {
  let handler: DatabaseErrorHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseErrorHandler],
    }).compile();

    handler = module.get<DatabaseErrorHandler>(DatabaseErrorHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handleError', () => {
    it.each([
      ['23505', DatabaseErrorCode.DUPLICATE_ENTRY],
      ['23503', DatabaseErrorCode.FOREIGN_KEY_VIOLATION],
      ['23502', DatabaseErrorCode.NULL_VIOLATION],
      ['99999', DatabaseErrorCode.DATABASE_ERROR],
    ])('maps Postgres code %s to %s', (pgCode, expectedCode) => {
      expect(() => handler.handleError(makeQueryFailedError(pgCode))).toThrow(
        expect.objectContaining({ code: expectedCode }),
      );
    });

    it('throws DATABASE_ERROR for a non-QueryFailedError', () => {
      expect(() => handler.handleError(new Error('generic'))).toThrow(
        expect.objectContaining({ code: DatabaseErrorCode.DATABASE_ERROR }),
      );
    });
  });
});
