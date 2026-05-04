import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { NotificationsController } from './notifications.controller';
import { NotificationService } from './notifications.service';
import {
  CreateNotificationDto,
  NotificationChannel,
} from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification } from './notification.entity';
import { JwtPayload } from 'src/auth/jwt-payload.interface';

const mockNotificationService = {
  createOne: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
  findAll: jest.fn(),
};

const mockUser: JwtPayload = {
  sub: 'user-id-1',
  email: 'user@test.com',
  iat: 0,
  exp: 9999999999,
};

describe('NotificationsController', () => {
  let controller: NotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateNotificationDto = {
      title: 'Test',
      content: 'Hello',
      channel: NotificationChannel.EMAIL,
      payload: { recipient: 'a@b.com', templateId: 'tpl1' },
    };

    it('returns service result string', async () => {
      mockNotificationService.createOne.mockResolvedValue('sent');

      const result = await controller.create(createDto, mockUser);

      expect(mockNotificationService.createOne).toHaveBeenCalledWith(
        createDto,
        mockUser,
      );
      expect(result).toBe('sent');
    });

    it('propagates errors from service', async () => {
      mockNotificationService.createOne.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(controller.create(createDto, mockUser)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateNotificationDto = { title: 'Updated' };

    it('calls service with correct params', async () => {
      mockNotificationService.updateOne.mockResolvedValue(undefined);

      await controller.update('notif-id', updateDto, mockUser);

      expect(mockNotificationService.updateOne).toHaveBeenCalledWith(
        'notif-id',
        updateDto,
        mockUser,
      );
    });

    it('propagates NotFoundException from service', async () => {
      mockNotificationService.updateOne.mockRejectedValue(
        new NotFoundException('Notification notif-id not found'),
      );

      await expect(
        controller.update('notif-id', updateDto, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('calls service with correct params', async () => {
      mockNotificationService.deleteOne.mockResolvedValue(undefined);

      await controller.delete('notif-id', mockUser);

      expect(mockNotificationService.deleteOne).toHaveBeenCalledWith(
        'notif-id',
        mockUser,
      );
    });

    it('propagates NotFoundException from service', async () => {
      mockNotificationService.deleteOne.mockRejectedValue(
        new NotFoundException('Notification notif-id not found'),
      );

      await expect(controller.delete('notif-id', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    const mockData: Notification[] = [
      {
        id: 'n1',
        title: 'T',
        content: 'C',
        channel: 'email',
        payload: { recipient: 'a@b.com', templateId: 't1' },
        user: {} as any,
      },
    ];

    it('returns paginated notifications from service', async () => {
      mockNotificationService.findAll.mockResolvedValue({
        data: mockData,
        total: 1,
      });

      const result = await controller.findAll(1, 10, mockUser);

      expect(mockNotificationService.findAll).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        mockUser,
      );
      expect(result).toEqual({ data: mockData, total: 1 });
    });

    it('coerces page and limit to numbers', async () => {
      mockNotificationService.findAll.mockResolvedValue({ data: [], total: 0 });

      await controller.findAll('2' as any, '5' as any, mockUser);

      expect(mockNotificationService.findAll).toHaveBeenCalledWith(
        { page: 2, limit: 5 },
        mockUser,
      );
    });
  });
});
