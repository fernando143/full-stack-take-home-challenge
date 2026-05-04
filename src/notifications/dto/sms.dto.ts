import { IsString, MaxLength, IsPhoneNumber } from 'class-validator';

export class SmsDto {
  @IsPhoneNumber()
  phoneNumber: string;

  @IsString()
  @MaxLength(160)
  content: string;
}
