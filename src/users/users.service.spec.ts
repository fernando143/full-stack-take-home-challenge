import { Test, TestingModule } from '@nestjs/testing';

import { UsersService } from './users.service';
import { DatabaseErrorHandler } from 'src/common/exceptions/database-error.handler';
import { User } from './user.entity';

const mockUserRepository = {
  findOne: jest.fn(),
  insert: jest.fn(),
};

const mockDbErrorHandler = {
  handleError: jest.fn((err) => {
    throw err;
  }),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: 'USER_REPOSITORY', useValue: mockUserRepository },
        { provide: DatabaseErrorHandler, useValue: mockDbErrorHandler },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('returns user when found', async () => {
      const user = {
        id: 'u1',
        email: 'user@test.com',
        password: 'hashed',
      } as User;
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findOne('user@test.com');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'user@test.com' },
      });
      expect(result).toEqual(user);
    });

    it('returns null when user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('unknown@test.com');

      expect(result).toBeNull();
    });

    it('propagates repository errors via dbErrorHandler', async () => {
      mockUserRepository.findOne.mockRejectedValue(new Error('DB error'));

      await expect(service.findOne('user@test.com')).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('registerOne', () => {
    it('inserts user with email and hashed password', async () => {
      mockUserRepository.insert.mockResolvedValue(undefined);

      await service.registerOne('new@test.com', 'hashed-password');

      expect(mockUserRepository.insert).toHaveBeenCalledWith({
        email: 'new@test.com',
        password: 'hashed-password',
      });
    });

    it('propagates repository errors via dbErrorHandler', async () => {
      mockUserRepository.insert.mockRejectedValue(new Error('Duplicate entry'));

      await expect(
        service.registerOne('dup@test.com', 'hashed'),
      ).rejects.toThrow('Duplicate entry');
    });
  });
});
