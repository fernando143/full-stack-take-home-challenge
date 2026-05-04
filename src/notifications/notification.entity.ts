import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { EmailDto } from './dto/email.dto';
import { SmsDto } from './dto/sms.dto';
import { PushDto } from './dto/push.dto';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column()
  channel: string;

  @Column({ type: 'simple-json' })
  payload: EmailDto | SmsDto | PushDto;

  @ManyToOne(() => User, (user) => user.notifications)
  user: User;
}
