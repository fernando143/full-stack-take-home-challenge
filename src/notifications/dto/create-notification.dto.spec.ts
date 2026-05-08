import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { CreateNotificationDto, NotificationChannel } from './create-notification.dto';
import { EmailDto } from './email.dto';
import { SmsDto } from './sms.dto';
import { PushDto } from './push.dto';
import { UnknownDto } from './unknown.dto';

describe('CreateNotificationDto @Type factory', () => {
  it.each([
    [NotificationChannel.EMAIL, EmailDto],
    [NotificationChannel.SMS, SmsDto],
    [NotificationChannel.PUSH, PushDto],
    ['unknown_channel', UnknownDto],
  ])('channel "%s" maps payload to %s', (channel, ExpectedClass) => {
    const dto = plainToInstance(CreateNotificationDto, {
      title: 'T',
      content: 'C',
      channel,
      payload: {},
    });

    expect(dto.payload).toBeInstanceOf(ExpectedClass);
  });
});
