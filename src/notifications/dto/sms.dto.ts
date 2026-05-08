import { IsString, MaxLength, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SmsDto {
  @ApiProperty({ example: '+15551234567' })
  @IsPhoneNumber()
  phoneNumber: string;

  @ApiProperty({ example: 'Your verification code is 123456', maxLength: 160 })
  @IsString()
  @MaxLength(160)
  content: string;
}
