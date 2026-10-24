import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DataStoreService } from '../../data/data-store.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Wallets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly store: DataStoreService) {}

  @Get()
  @ApiOperation({ summary: 'List wallets of the authenticated user' })
  list(@CurrentUser('sub') userId: string) {
    return this.store.getWallets(userId);
  }
}
