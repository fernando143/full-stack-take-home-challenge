import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';

import { CreateNotificationDto } from './dto/create-notification.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { NotificationService } from './notifications.service';
import { JwtPayload } from 'src/auth/jwt-payload.interface';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification } from './notification.entity';

@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async create(
    @Body() createNotificationDto: CreateNotificationDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<string> {
    return this.notificationsService.createOne(createNotificationDto, user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body()
    updateDto: UpdateNotificationDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.notificationsService.updateOne(id, updateDto, user);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.notificationsService.deleteOne(id, user);
  }

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ data: Notification[]; total: number }> {
    return this.notificationsService.findAll(
      { page: Number(page), limit: Number(limit) },
      user,
    );
  }
}
