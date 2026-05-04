import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';

import { NotificationService } from './notifications.service';
import { DatabaseErrorHandler } from 'src/common/exceptions/database-error.handler';
import {
  NotificationStrategyFactory,
  EmailRepository,
  SmsRepository,
  PushRepository,
} from './notification-strategy.factory';
import { Notification } from './notification.entity';
import {
  CreateNotificationDto,
  NotificationChannel,
} from './dto/create-notification.dto';
import { JwtPayload } from 'src/auth/jwt-payload.interface';

const mockRepository = {
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  preload: jest.fn(),
  delete: jest.fn(),
};

const mockDbErrorHandler = {
  handleError: jest.fn((err) => {
    throw err;
  }),
};

const mockStrategyFactory = {
  execute: jest.fn(),
};

const mockUser: JwtPayload = {
  sub: 'user-id-1',
  email: 'user@test.com',
  iat: 0,
  exp: 9999999999,
};

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: 'NOTIFICATION_REPOSITORY',
          useValue: mockRepository,
        },
        {
          provide: DatabaseErrorHandler,
          useValue: mockDbErrorHandler,
        },
        {
          provide: NotificationStrategyFactory,
          useValue: mockStrategyFactory,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns paginated notifications', async () => {
      const notifications: Notification[] = [
        {
          id: 'n1',
          title: 'T',
          content: 'C',
          channel: 'email',
          payload: { recipient: 'a@b.com', templateId: 't1' },
          user: {} as any,
        },
      ];
      mockRepository.findAndCount.mockResolvedValue([notifications, 1]);

      const result = await service.findAll({ page: 1, limit: 10 }, mockUser);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { user: { id: mockUser.sub } },
        skip: 0,
        take: 10,
        order: { id: 'DESC' },
      });
      expect(result).toEqual({ data: notifications, total: 1 });
    });

    it('applies correct skip for page > 1', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 3, limit: 5 }, mockUser);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });

    it('propagates repository errors via dbErrorHandler', async () => {
      const dbError = new Error('DB failure');
      mockRepository.findAndCount.mockRejectedValue(dbError);

      await expect(
        service.findAll({ page: 1, limit: 10 }, mockUser),
      ).rejects.toThrow('DB failure');
    });
  });

  describe('createOne', () => {
    const setupSaveSuccess = (dto: CreateNotificationDto) => {
      const notification = { id: 'n1', ...dto };
      mockRepository.create.mockReturnValue(notification);
      mockRepository.save.mockResolvedValue(notification);
      return notification;
    };

    describe('EMAIL channel', () => {
      const emailDto: CreateNotificationDto = {
        title: 'Email Test',
        content: 'Hello',
        channel: NotificationChannel.EMAIL,
        payload: { recipient: 'a@b.com', templateId: 'tpl1' },
      };

      it('saves notification and returns strategy result', async () => {
        const notification = setupSaveSuccess(emailDto);
        const expected = 'Template: tpl1 recipient: a@b.com';
        mockStrategyFactory.execute.mockResolvedValue(expected);

        const result = await service.createOne(emailDto, mockUser);

        expect(mockRepository.create).toHaveBeenCalledWith({
          ...emailDto,
          user: { id: mockUser.sub },
        });
        expect(mockRepository.save).toHaveBeenCalledWith(notification);
        expect(mockStrategyFactory.execute).toHaveBeenCalledWith(emailDto);
        expect(result).toBe(expected);
      });

      it('propagates save errors', async () => {
        mockRepository.create.mockReturnValue({});
        mockRepository.save.mockRejectedValue(new Error('save failed'));

        await expect(service.createOne(emailDto, mockUser)).rejects.toThrow(
          'save failed',
        );
      });
    });

    describe('SMS channel', () => {
      const smsDto: CreateNotificationDto = {
        title: 'SMS Test',
        content: 'Hello SMS',
        channel: NotificationChannel.SMS,
        payload: { phoneNumber: '+1234567890', content: 'Hello' },
      };

      it('saves notification and returns strategy result', async () => {
        const notification = setupSaveSuccess(smsDto);
        const expected = 'number: +1234567890 content: Hello';
        mockStrategyFactory.execute.mockResolvedValue(expected);

        const result = await service.createOne(smsDto, mockUser);

        expect(mockRepository.create).toHaveBeenCalledWith({
          ...smsDto,
          user: { id: mockUser.sub },
        });
        expect(mockRepository.save).toHaveBeenCalledWith(notification);
        expect(mockStrategyFactory.execute).toHaveBeenCalledWith(smsDto);
        expect(result).toBe(expected);
      });

      it('propagates save errors', async () => {
        mockRepository.create.mockReturnValue({});
        mockRepository.save.mockRejectedValue(new Error('save failed'));

        await expect(service.createOne(smsDto, mockUser)).rejects.toThrow(
          'save failed',
        );
      });
    });

    describe('PUSH channel', () => {
      const pushDto: CreateNotificationDto = {
        title: 'Push Test',
        content: 'Push content',
        channel: NotificationChannel.PUSH,
        payload: { deviceToken: 'valid-token', title: 'Push', data: { key: 'val' } },
      };

      it('saves notification and returns serialized push result', async () => {
        const notification = setupSaveSuccess(pushDto);
        const expected = JSON.stringify({ title: 'Push', data: { key: 'val' } });
        mockStrategyFactory.execute.mockResolvedValue(expected);

        const result = await service.createOne(pushDto, mockUser);

        expect(mockRepository.create).toHaveBeenCalledWith({
          ...pushDto,
          user: { id: mockUser.sub },
        });
        expect(mockRepository.save).toHaveBeenCalledWith(notification);
        expect(mockStrategyFactory.execute).toHaveBeenCalledWith(pushDto);
        expect(result).toBe(expected);
      });

      it('propagates BadRequestException when deviceToken is empty', async () => {
        const emptyTokenDto: CreateNotificationDto = {
          ...pushDto,
          payload: { deviceToken: '', title: 'Push', data: {} },
        };
        setupSaveSuccess(emptyTokenDto);
        mockStrategyFactory.execute.mockRejectedValue(
          new BadRequestException('Invalid or empty device token'),
        );

        await expect(service.createOne(emptyTokenDto, mockUser)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('propagates BadRequestException when deviceToken is whitespace only', async () => {
        const whitespaceTokenDto: CreateNotificationDto = {
          ...pushDto,
          payload: { deviceToken: '   ', title: 'Push', data: {} },
        };
        setupSaveSuccess(whitespaceTokenDto);
        mockStrategyFactory.execute.mockRejectedValue(
          new BadRequestException('Invalid or empty device token'),
        );

        await expect(
          service.createOne(whitespaceTokenDto, mockUser),
        ).rejects.toThrow(BadRequestException);
      });

      it('propagates save errors', async () => {
        mockRepository.create.mockReturnValue({});
        mockRepository.save.mockRejectedValue(new Error('save failed'));

        await expect(service.createOne(pushDto, mockUser)).rejects.toThrow(
          'save failed',
        );
      });
    });
  });

  describe('updateOne', () => {
    const updateDto = { title: 'Updated' };

    it('preloads and saves notification', async () => {
      const notification = { id: 'n1', title: 'Updated' };
      mockRepository.preload.mockResolvedValue(notification);
      mockRepository.save.mockResolvedValue(notification);

      await service.updateOne('n1', updateDto, mockUser);

      expect(mockRepository.preload).toHaveBeenCalledWith({
        id: 'n1',
        user: { id: mockUser.sub },
        ...updateDto,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(notification);
    });

    it('throws NotFoundException when notification does not exist', async () => {
      mockRepository.preload.mockResolvedValue(null);

      await expect(
        service.updateOne('missing-id', updateDto, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('propagates preload errors', async () => {
      mockRepository.preload.mockRejectedValue(new Error('DB error'));

      await expect(
        service.updateOne('n1', updateDto, mockUser),
      ).rejects.toThrow('DB error');
    });
  });

  describe('deleteOne', () => {
    it('deletes notification successfully', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteOne('n1', mockUser);

      expect(mockRepository.delete).toHaveBeenCalledWith({
        id: 'n1',
        user: { id: mockUser.sub },
      });
    });

    it('throws NotFoundException when affected is 0', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.deleteOne('missing-id', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates delete errors', async () => {
      mockRepository.delete.mockRejectedValue(new Error('DB error'));

      await expect(service.deleteOne('n1', mockUser)).rejects.toThrow(
        'DB error',
      );
    });
  });
});

describe('NotificationStrategyFactory', () => {
  let factory: NotificationStrategyFactory;

  const mockEmailRepo: EmailRepository = { save: jest.fn() };
  const mockSmsRepo: SmsRepository = { save: jest.fn() };
  const mockPushRepo: PushRepository = { save: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationStrategyFactory,
        { provide: 'EMAIL_REPOSITORY', useValue: mockEmailRepo },
        { provide: 'SMS_REPOSITORY', useValue: mockSmsRepo },
        { provide: 'PUSH_REPOSITORY', useValue: mockPushRepo },
      ],
    }).compile();

    factory = module.get<NotificationStrategyFactory>(NotificationStrategyFactory);
    jest.clearAllMocks();
  });

  describe('EMAIL strategy', () => {
    it('saves payload and returns formatted string', async () => {
      const dto: CreateNotificationDto = {
        title: 'T',
        content: 'C',
        channel: NotificationChannel.EMAIL,
        payload: { recipient: 'user@test.com', templateId: 'welcome' },
      };
      (mockEmailRepo.save as jest.Mock).mockResolvedValue(undefined);

      const result = await factory.execute(dto);

      expect(mockEmailRepo.save).toHaveBeenCalledWith(dto.payload);
      expect(result).toBe('Template: welcome recipient: user@test.com');
    });
  });

  describe('SMS strategy', () => {
    it('saves payload and returns formatted string', async () => {
      const dto: CreateNotificationDto = {
        title: 'T',
        content: 'C',
        channel: NotificationChannel.SMS,
        payload: { phoneNumber: '+5491112345678', content: 'Your code is 1234' },
      };
      (mockSmsRepo.save as jest.Mock).mockResolvedValue(undefined);

      const result = await factory.execute(dto);

      expect(mockSmsRepo.save).toHaveBeenCalledWith(dto.payload);
      expect(result).toBe('number: +5491112345678 content: Your code is 1234');
    });
  });

  describe('PUSH strategy', () => {
    it('saves payload and returns serialized JSON', async () => {
      const dto: CreateNotificationDto = {
        title: 'T',
        content: 'C',
        channel: NotificationChannel.PUSH,
        payload: { deviceToken: 'abc123', title: 'New message', data: { id: 42 } },
      };
      (mockPushRepo.save as jest.Mock).mockResolvedValue(undefined);

      const result = await factory.execute(dto);

      expect(mockPushRepo.save).toHaveBeenCalledWith(dto.payload);
      expect(result).toBe(JSON.stringify({ title: 'New message', data: { id: 42 } }));
    });

    it('throws BadRequestException when deviceToken is empty string', async () => {
      const dto: CreateNotificationDto = {
        title: 'T',
        content: 'C',
        channel: NotificationChannel.PUSH,
        payload: { deviceToken: '', title: 'Push', data: {} },
      };

      await expect(factory.execute(dto)).rejects.toThrow(BadRequestException);
      expect(mockPushRepo.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when deviceToken is whitespace only', async () => {
      const dto: CreateNotificationDto = {
        title: 'T',
        content: 'C',
        channel: NotificationChannel.PUSH,
        payload: { deviceToken: '   ', title: 'Push', data: {} },
      };

      await expect(factory.execute(dto)).rejects.toThrow(BadRequestException);
      expect(mockPushRepo.save).not.toHaveBeenCalled();
    });
  });
});
