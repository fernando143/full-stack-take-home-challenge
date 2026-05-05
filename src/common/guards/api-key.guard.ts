import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly validKeys: Set<string>;

  constructor(private readonly configService: ConfigService) {
    const raw = this.configService.get<string>('API_KEYS') ?? '';
    this.validKeys = new Set(
      raw
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const key = request.headers['x-api-key'];

    if (typeof key !== 'string' || !this.validKeys.has(key)) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }
}
