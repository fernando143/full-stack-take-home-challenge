import { IsString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PushDto {
  @ApiProperty({ example: 'fcm-device-token-abc123' })
  @IsString()
  deviceToken: string;

  @ApiProperty({ example: 'New message' })
  @IsString()
  title: string;

  @ApiProperty({ example: { messageId: '42', unread: 3 } })
  @IsObject()
  data: Record<string, unknown>;
}
