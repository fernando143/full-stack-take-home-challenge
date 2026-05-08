import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';

const mockJwtService = { verifyAsync: jest.fn() };
const mockReflector = { getAllAndOverride: jest.fn() };

const createMockContext = (authHeader?: string): ExecutionContext =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        headers: authHeader ? { authorization: authHeader } : {},
      }),
    }),
  }) as unknown as ExecutionContext;

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: JwtService, useValue: mockJwtService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('returns true for public routes without verifying token', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(createMockContext());

      expect(result).toBe(true);
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when Authorization header is missing', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      await expect(guard.canActivate(createMockContext())).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when scheme is not Bearer', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      await expect(
        guard.canActivate(createMockContext('Basic abc123')),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when token is invalid or expired', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockJwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

      await expect(
        guard.canActivate(createMockContext('Bearer invalid.token.here')),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('attaches payload to request.user and returns true for valid token', async () => {
      const payload = { sub: 'user-id', email: 'user@test.com' };
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockJwtService.verifyAsync.mockResolvedValue(payload);

      const request = { headers: { authorization: 'Bearer valid.token' } };
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({ getRequest: () => request }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request['user']).toEqual(payload);
    });
  });
});
