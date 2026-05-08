import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EmailDto {
  @ApiProperty({ example: 'recipient@example.com' })
  @IsEmail()
  recipient: string;

  @ApiProperty({ example: 'welcome-template' })
  @IsString()
  templateId: string;
}
