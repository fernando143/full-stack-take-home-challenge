import { DataSource } from 'typeorm';
import { Notification } from './notification.entity';
import { EmailDto } from './dto/email.dto';
import { SmsDto } from './dto/sms.dto';
import { PushDto } from './dto/push.dto';

export const notificationProviders = [
  {
    provide: 'NOTIFICATION_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Notification),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'EMAIL_REPOSITORY',
    useValue: {
      save: async (payload: EmailDto) => {
        console.log('[EmailRepository] saved:', payload);
        return Promise.resolve(payload);
      },
    },
  },
  {
    provide: 'SMS_REPOSITORY',
    useValue: {
      save: async (payload: SmsDto) => {
        console.log('[SmsRepository] saved:', payload);
        return Promise.resolve(payload);
      },
    },
  },
  {
    provide: 'PUSH_REPOSITORY',
    useValue: {
      save: async (payload: PushDto) => {
        console.log('[PushRepository] saved:', payload);
        return Promise.resolve(payload);
      },
    },
  },
];
