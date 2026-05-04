import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';

jest.mock('argon2');

const mockUsersService = {
  findOne: jest.fn(),
  registerOne: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const credentials = { email: 'user@test.com', password: 'secret' };
    const storedUser = {
      id: 'user-id',
      email: 'user@test.com',
      password: 'hashed',
    };

    it('returns access_token on valid credentials', async () => {
      mockUsersService.findOne.mockResolvedValue(storedUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await service.login(credentials);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(credentials.email);
      expect(argon2.verify).toHaveBeenCalledWith(
        storedUser.password,
        credentials.password,
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: storedUser.id,
        email: storedUser.email,
      });
      expect(result).toEqual({ access_token: 'jwt-token' });
    });

    it('throws UnauthorizedException when user is not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(service.login(credentials)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(argon2.verify).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when password does not match', async () => {
      mockUsersService.findOne.mockResolvedValue(storedUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.login(credentials)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    const credentials = { email: 'new@test.com', password: 'plain' };

    it('hashes password and calls usersService.registerOne', async () => {
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockUsersService.registerOne.mockResolvedValue(undefined);

      await service.register(credentials);

      expect(argon2.hash).toHaveBeenCalledWith(credentials.password);
      expect(mockUsersService.registerOne).toHaveBeenCalledWith(
        credentials.email,
        'hashed-password',
      );
    });

    it('propagates errors from usersService.registerOne', async () => {
      (argon2.hash as jest.Mock).mockResolvedValue('hashed');
      mockUsersService.registerOne.mockRejectedValue(
        new Error('Email already exists'),
      );

      await expect(service.register(credentials)).rejects.toThrow(
        'Email already exists',
      );
    });
  });
});
