import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DataStoreService } from '../../data/data-store.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApplyLoanDto, ReviewLoanDto } from './dto/loan.dto';

@ApiTags('Loans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loans')
export class LoansController {
  constructor(private readonly store: DataStoreService) {}

  @Get()
  @ApiOperation({ summary: 'List loans (customers see their own, admins see all)' })
  list(@CurrentUser() user: { sub: string; role: string }) {
    if (user.role === 'admin') return this.store.loans;
    return this.store.loans.filter((l) => l.applicantId === user.sub);
  }

  @Post('apply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Apply for a loan' })
  apply(@CurrentUser() user: { sub: string; name: string; phone: string }, @Body() dto: ApplyLoanDto) {
    const interestRate = dto.type === 'susu-backed' ? 5 : dto.type === 'education' ? 6 : 8;
    const monthlyPayment = Math.round((dto.amount * (1 + interestRate / 100)) / dto.termMonths * 100) / 100;
    const applicant = this.store.findUserById(user.sub);
    const creditScore = 55 + Math.min(Math.round((applicant?.kycLevel === 'full' ? 20 : 8)), 25);

    const loan = {
      id: this.store.nextId('ln'),
      applicantId: user.sub,
      applicantName: user.name,
      applicantPhone: user.phone,
      type: dto.type as any,
      amount: dto.amount,
      interestRate,
      term: dto.termMonths,
      termUnit: 'months' as const,
      status: 'pending' as const,
      monthlyPayment,
      remainingBalance: dto.amount,
      totalPaid: 0,
      nextPaymentDate: '',
      startDate: '',
      endDate: '',
      purpose: dto.purpose,
      creditScore,
      branch: applicant?.branch || 'Accra Central',
      disbursementMethod: 'momo' as const,
    };
    this.store.loans.unshift(loan);
    return loan;
  }

  @Post(':id/review')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @ApiOperation({ summary: 'Approve or reject a loan (admin only)' })
  review(@Param('id') id: string, @Body() dto: ReviewLoanDto) {
    const loan = this.store.loans.find((l) => l.id === id);
    if (!loan) return { error: 'Loan not found' };
    if (loan.status !== 'pending') return { error: `Loan is already ${loan.status}` };

    if (dto.action === 'approve') {
      loan.status = 'active';
      loan.startDate = new Date().toISOString().slice(0, 10);
      const end = new Date();
      end.setMonth(end.getMonth() + loan.term);
      loan.endDate = end.toISOString().slice(0, 10);
      const next = new Date();
      next.setMonth(next.getMonth() + 1);
      loan.nextPaymentDate = next.toISOString().slice(0, 10);
    } else {
      loan.status = 'rejected';
      loan.rejectionReason = dto.reason || 'Did not meet lending criteria';
    }
    return loan;
  }
}
