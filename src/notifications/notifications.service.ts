import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Notification } from './notification.entity';
import { JwtPayload } from 'src/auth/jwt-payload.interface';
import { DatabaseErrorHandler } from 'src/common/exceptions/database-error.handler';
import { NotificationStrategyFactory } from './notification-strategy.factory';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @Inject('NOTIFICATION_REPOSITORY')
    private notificationRepository: Repository<Notification>,
    private dbErrorHandler: DatabaseErrorHandler,
    private strategyFactory: NotificationStrategyFactory,
  ) {}

  async findAll(
    { page, limit }: { page: number; limit: number },
    user: JwtPayload,
  ): Promise<{ data: Notification[]; total: number }> {
    const [data, total] = await this.notificationRepository
      .findAndCount({
        where: { user: { id: user.sub } },
        skip: (page - 1) * limit,
        take: limit,
        order: { id: 'DESC' },
      })
      .catch((err) => this.dbErrorHandler.handleError(err));

    return { data, total };
  }

  async createOne(
    createNotificationDto: CreateNotificationDto,
    user: JwtPayload,
  ): Promise<string> {
    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      user: { id: user.sub },
    });

    await this.notificationRepository
      .save(notification)
      .catch((err) => this.dbErrorHandler.handleError(err));

    return this.strategyFactory.execute(createNotificationDto);
  }

  async updateOne(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
    user: JwtPayload,
  ): Promise<void> {
    const notification = await this.notificationRepository
      .preload({ id, user: { id: user.sub }, ...updateNotificationDto })
      .catch((err) => this.dbErrorHandler.handleError(err));

    if (!notification) throw new NotFoundException(`Notification ${id} not found`);

    await this.notificationRepository
      .save(notification)
      .catch((err) => this.dbErrorHandler.handleError(err));
  }

  async deleteOne(id: string, user: JwtPayload): Promise<void> {
    const result = await this.notificationRepository
      .delete({ id, user: { id: user.sub } })
      .catch((err) => this.dbErrorHandler.handleError(err));

    if (result.affected === 0)
      throw new NotFoundException(`Notification ${id} not found`);
  }
}
