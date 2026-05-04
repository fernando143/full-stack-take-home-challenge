import { IsString, IsObject } from 'class-validator';

export class PushDto {
  @IsString()
  deviceToken: string;

  @IsString()
  title: string;

  @IsObject()
  data: Record<string, unknown>;
}
