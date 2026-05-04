import { IsEnum, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EmailDto } from './email.dto';
import { SmsDto } from './sms.dto';
import { PushDto } from './push.dto';
import { UnknownDto } from './unknown.dto';

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

export class CreateNotificationDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ValidateNested()
  @Type((opts) => {
    switch (opts?.object?.channel) {
      case NotificationChannel.EMAIL:
        return EmailDto;
      case NotificationChannel.SMS:
        return SmsDto;
      case NotificationChannel.PUSH:
        return PushDto;
      default: //ts requires this fallback
        return UnknownDto;
    }
  })
  payload: EmailDto | SmsDto | PushDto;
}
