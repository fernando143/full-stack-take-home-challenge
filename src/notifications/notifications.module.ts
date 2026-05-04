import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/database/database.module';
import { CommonModule } from 'src/common/common.module';
import { NotificationService } from './notifications.service';
import { notificationProviders } from './notifications.providers';
import { NotificationStrategyFactory } from './notification-strategy.factory';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [DatabaseModule, CommonModule],
  providers: [
    NotificationService,
    NotificationStrategyFactory,
    ...notificationProviders,
  ],
  controllers: [NotificationsController],
  exports: [NotificationService],
})
export class NotificationsModule {}
