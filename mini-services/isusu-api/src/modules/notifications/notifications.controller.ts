import { Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DataStoreService } from '../../data/data-store.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly store: DataStoreService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications of the authenticated user' })
  list(@CurrentUser('sub') userId: string) {
    return this.store.notifications.filter((n) => n.userId === userId);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    const n = this.store.notifications.find((x) => x.id === id && x.userId === userId);
    if (n) n.read = true;
    return { ok: !!n };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser('sub') userId: string) {
    this.store.notifications.filter((n) => n.userId === userId).forEach((n) => (n.read = true));
    return { ok: true };
  }
}
