import { IsEmail, IsString } from 'class-validator';

export class EmailDto {
  @IsEmail()
  recipient: string;

  @IsString()
  templateId: string;
}
