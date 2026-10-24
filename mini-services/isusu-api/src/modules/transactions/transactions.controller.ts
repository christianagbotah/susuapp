import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DataStoreService } from '../../data/data-store.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TransferDto } from './dto/transfer.dto';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly store: DataStoreService) {}

  @Get()
  @ApiOperation({ summary: 'List transactions of the authenticated user' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  list(
    @CurrentUser('sub') userId: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    let txns = this.store.transactions.filter((t) => t.userId === userId);
    if (type) txns = txns.filter((t) => t.type === type);
    const max = limit ? parseInt(limit, 10) : 50;
    return txns.slice(0, Math.min(Math.max(max, 1), 100));
  }

  @Post('transfer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Transfer funds from the main wallet to a recipient phone' })
  transfer(@CurrentUser('sub') userId: string, @CurrentUser('name') senderName: string, @Body() dto: TransferDto) {
    const recipient = this.store.findUserByPhone(
      dto.recipientPhone.startsWith('0') ? dto.recipientPhone : `0${dto.recipientPhone.replace(/\D/g, '')}`,
    );

    const txn = this.store.debit(userId, dto.amount, {
      type: 'transfer',
      description: `Transfer to ${recipient?.name ?? dto.recipientPhone}${dto.note ? ` - ${dto.note}` : ''}`,
      reference: this.store.generateReference(),
      category: 'Transfer',
      counterpartName: dto.recipientPhone,
    });

    if (recipient) {
      this.store.credit(recipient.id, dto.amount, {
        type: 'deposit',
        description: `Transfer from ${senderName}`,
        reference: txn.reference,
        category: 'Transfer',
        counterpartName: senderName,
      });
    }

    return {
      transaction: txn,
      recipient: recipient ? this.store.sanitizeUser(recipient) : { phone: dto.recipientPhone, registered: false },
    };
  }
}
