import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import {
  CreateNotificationDto,
  NotificationChannel,
} from './dto/create-notification.dto';
import { EmailDto } from './dto/email.dto';
import { SmsDto } from './dto/sms.dto';
import { PushDto } from './dto/push.dto';

interface NotificationStrategy<T> {
  send(payload: T): Promise<string>;
}

export interface EmailRepository {
  save(payload: EmailDto): Promise<void>;
}

export interface SmsRepository {
  save(payload: SmsDto): Promise<void>;
}

export interface PushRepository {
  save(payload: PushDto): Promise<void>;
}

class EmailStrategy implements NotificationStrategy<EmailDto> {
  constructor(private readonly repository: EmailRepository) {}

  async send(payload: EmailDto): Promise<string> {
    await this.repository.save(payload);
    return `Template: ${payload.templateId} recipient: ${payload.recipient}`;
  }
}

class SmsStrategy implements NotificationStrategy<SmsDto> {
  constructor(private readonly repository: SmsRepository) {}

  async send(payload: SmsDto): Promise<string> {
    await this.repository.save(payload);
    return `number: ${payload.phoneNumber} content: ${payload.content}`;
  }
}

class PushStrategy implements NotificationStrategy<PushDto> {
  constructor(private readonly repository: PushRepository) {}

  async send(payload: PushDto): Promise<string> {
    if (!payload.deviceToken || payload.deviceToken.trim().length === 0) {
      throw new BadRequestException('Invalid or empty device token');
    }

    await this.repository.save(payload);

    return JSON.stringify({ title: payload.title, data: payload.data });
  }
}

@Injectable()
export class NotificationStrategyFactory {
  private readonly strategies: Record<
    NotificationChannel,
    NotificationStrategy<EmailDto | SmsDto | PushDto>
  >;

  constructor(
    @Inject('EMAIL_REPOSITORY') emailRepository: EmailRepository,
    @Inject('SMS_REPOSITORY') smsRepository: SmsRepository,
    @Inject('PUSH_REPOSITORY') pushRepository: PushRepository,
  ) {
    this.strategies = {
      [NotificationChannel.EMAIL]: new EmailStrategy(emailRepository),
      [NotificationChannel.SMS]: new SmsStrategy(smsRepository),
      [NotificationChannel.PUSH]: new PushStrategy(pushRepository),
    };
  }

  execute(dto: CreateNotificationDto): Promise<string> {
    switch (dto.channel) {
      case NotificationChannel.EMAIL:
        return this.strategies[NotificationChannel.EMAIL].send(dto.payload);
      case NotificationChannel.SMS:
        return this.strategies[NotificationChannel.SMS].send(dto.payload);
      case NotificationChannel.PUSH:
        return this.strategies[NotificationChannel.PUSH].send(dto.payload);
    }
  }
}
