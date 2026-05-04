import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';

const mockAuthService = {
  login: jest.fn(),
  register: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const loginDto: LoginDto = { email: 'user@test.com', password: 'secret' };

    it('returns access_token on valid credentials', async () => {
      const token = { access_token: 'jwt-token' };
      mockAuthService.login.mockResolvedValue(token);

      const result = await controller.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: loginDto.email,
        password: loginDto.password,
      });
      expect(result).toEqual(token);
    });

    it('propagates UnauthorizedException on invalid credentials', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid email or password'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    const registerDto: RegisterUserDto = {
      email: 'newuser@test.com',
      password: 'password123',
    };

    it('calls authService.register with correct data', async () => {
      mockAuthService.register.mockResolvedValue(undefined);

      await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: registerDto.email,
        password: registerDto.password,
      });
    });

    it('returns void on successful registration', async () => {
      mockAuthService.register.mockResolvedValue(undefined);

      const result = await controller.register(registerDto);

      expect(result).toBeUndefined();
    });

    it('propagates errors thrown by authService.register', async () => {
      mockAuthService.register.mockRejectedValue(
        new Error('Email already in use'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        'Email already in use',
      );
    });
  });
});
