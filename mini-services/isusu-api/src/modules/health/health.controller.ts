import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DataStoreService } from '../../data/data-store.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly store: DataStoreService) {}

  @Get()
  @ApiOperation({ summary: 'API health check' })
  check() {
    return {
      status: 'ok',
      service: 'isusu-api',
      version: '1.0.0',
      platform: 'NestJS',
      timestamp: new Date().toISOString(),
      stats: {
        users: this.store.users.length,
        transactions: this.store.transactions.length,
        susuGroups: this.store.susuGroups.length,
        loans: this.store.loans.length,
      },
    };
  }
}
