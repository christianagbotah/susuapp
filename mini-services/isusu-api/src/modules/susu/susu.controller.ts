import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DataStoreService } from '../../data/data-store.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ContributeDto } from './dto/contribute.dto';

@ApiTags('Susu')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('susu')
export class SusuController {
  constructor(private readonly store: DataStoreService) {}

  @Get('groups')
  @ApiOperation({ summary: 'List susu groups of the authenticated user' })
  groups() {
    return this.store.susuGroups;
  }

  @Get('contributions')
  @ApiOperation({ summary: 'List my susu contributions' })
  contributions(@CurrentUser('sub') userId: string) {
    return this.store.contributions.filter((c) => c.memberId === userId);
  }

  @Post('contribute')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Make a susu contribution from the main wallet' })
  contribute(@CurrentUser() user: { sub: string; name: string }, @Body() dto: ContributeDto) {
    const group = this.store.susuGroups.find((g) => g.id === dto.groupId);
    if (!group) throw new NotFoundException('Susu group not found');

    const txn = this.store.debit(user.sub, dto.amount, {
      type: 'susu_contribution',
      description: `Contribution to ${group.name}`,
      reference: this.store.generateReference(),
      category: 'Susu',
    });

    const contribution = {
      id: this.store.nextId('sc'),
      groupId: group.id,
      groupName: group.name,
      memberId: user.sub,
      memberName: user.name,
      amount: dto.amount,
      date: new Date().toISOString(),
      status: 'paid' as const,
      collectedByName: dto.collectedBy === 'agent' ? 'Agent Collection' : 'Self Payment',
      round: group.currentRound,
    };
    this.store.contributions.unshift(contribution);

    return { contribution, transaction: txn, group };
  }
}
