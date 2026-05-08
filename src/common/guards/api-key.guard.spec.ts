import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from './api-key.guard';

const mockConfigService = {
  get: jest.fn(),
};

const createMockContext = (apiKey?: string): ExecutionContext => {
  const headers: Record<string, string> = {};
  if (apiKey !== undefined) {
    headers['x-api-key'] = apiKey;
  }
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext;
};

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;

  beforeEach(async () => {
    mockConfigService.get.mockReturnValue('valid-key-1,valid-key-2');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('returns true when the first valid API key is provided', () => {
      const context = createMockContext('valid-key-1');
      expect(guard.canActivate(context)).toBe(true);
    });

    it('returns true when the second valid API key is provided', () => {
      const context = createMockContext('valid-key-2');
      expect(guard.canActivate(context)).toBe(true);
    });

    it('throws UnauthorizedException when the X-API-Key header is missing', () => {
      const context = createMockContext();
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the API key is invalid', () => {
      const context = createMockContext('wrong-key');
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the API key is an empty string', () => {
      const context = createMockContext('');
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('rejects any key when API_KEYS env var is not set', async () => {
      mockConfigService.get.mockReturnValue(undefined);
      const module = await Test.createTestingModule({
        providers: [
          ApiKeyGuard,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();
      const guardWithNoKeys = module.get<ApiKeyGuard>(ApiKeyGuard);

      expect(() => guardWithNoKeys.canActivate(createMockContext('any-key'))).toThrow(
        UnauthorizedException,
      );
    });
  });
});
