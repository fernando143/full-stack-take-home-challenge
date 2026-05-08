import { IsEnum, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'Welcome!' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Thanks for joining us.' })
  @IsString()
  content: string;

  @ApiProperty({ enum: NotificationChannel, example: NotificationChannel.EMAIL })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({
    description: 'Channel-specific payload (EmailDto | SmsDto | PushDto)',
    oneOf: [
      { $ref: '#/components/schemas/EmailDto' },
      { $ref: '#/components/schemas/SmsDto' },
      { $ref: '#/components/schemas/PushDto' },
    ],
  })
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
