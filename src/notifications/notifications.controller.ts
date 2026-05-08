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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

import { CreateNotificationDto } from './dto/create-notification.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { NotificationService } from './notifications.service';
import { JwtPayload } from 'src/auth/jwt-payload.interface';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification } from './notification.entity';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationService) {}

  @ApiOperation({ summary: 'Create a notification' })
  @ApiResponse({ status: 201, description: 'Notification created, returns its ID' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  async create(
    @Body() createNotificationDto: CreateNotificationDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<string> {
    return this.notificationsService.createOne(createNotificationDto, user);
  }

  @ApiOperation({ summary: 'Update a notification' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  @ApiResponse({ status: 200, description: 'Notification updated' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body()
    updateDto: UpdateNotificationDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.notificationsService.updateOne(id, updateDto, user);
  }

  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  @ApiResponse({ status: 204, description: 'Notification deleted' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.notificationsService.deleteOne(id, user);
  }

  @ApiOperation({ summary: 'List notifications with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Paginated list of notifications' })
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
