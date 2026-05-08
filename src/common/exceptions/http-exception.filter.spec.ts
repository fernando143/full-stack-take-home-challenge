import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GlobalExceptionFilter } from './http-exception.filter';
import { DatabaseException, DatabaseErrorCode } from './database.exception';

const createMockHost = (): {
  host: ArgumentsHost;
  status: jest.Mock;
  json: jest.Mock;
} => {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
};

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
  });

  describe('DatabaseException', () => {
    it.each([
      [DatabaseErrorCode.DUPLICATE_ENTRY, HttpStatus.CONFLICT],
      [DatabaseErrorCode.FOREIGN_KEY_VIOLATION, HttpStatus.BAD_REQUEST],
      [DatabaseErrorCode.NULL_VIOLATION, HttpStatus.BAD_REQUEST],
      [DatabaseErrorCode.DATABASE_ERROR, HttpStatus.INTERNAL_SERVER_ERROR],
    ])('maps %s to HTTP status %s', (code, expectedStatus) => {
      const { host, status, json } = createMockHost();
      const exception = new DatabaseException('some message', code);

      filter.catch(exception, host);

      expect(status).toHaveBeenCalledWith(expectedStatus);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: expectedStatus, message: 'some message', code }),
      );
    });
  });

  describe('HttpException', () => {
    it('handles HttpException with string body', () => {
      const { host, status, json } = createMockHost();

      filter.catch(new HttpException('Not found', HttpStatus.NOT_FOUND), host);

      expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Not found',
          code: 'NOT_FOUND',
        }),
      );
    });

    it('handles HttpException with object body', () => {
      const { host, status, json } = createMockHost();

      filter.catch(new BadRequestException(['field is required']), host);

      expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: ['field is required'],
          code: 'BAD_REQUEST',
        }),
      );
    });
  });

  describe('unknown error', () => {
    it('returns 500 for a generic Error', () => {
      const { host, status, json } = createMockHost();

      filter.catch(new Error('boom'), host);

      expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          code: 'INTERNAL_SERVER_ERROR',
        }),
      );
    });
  });
});
