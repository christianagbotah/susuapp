import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ApplyLoanDto {
  @ApiProperty({ enum: ['business', 'personal', 'education', 'emergency', 'susu-backed'] })
  @IsIn(['business', 'personal', 'education', 'emergency', 'susu-backed'])
  type: string;

  @ApiProperty({ example: 5000, minimum: 100 })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiProperty({ example: 'Expand shop inventory' })
  @IsString()
  purpose: string;

  @ApiProperty({ example: 6, minimum: 1, maximum: 36 })
  @IsNumber()
  @Min(1)
  @Max(36)
  termMonths: number;
}

export class ReviewLoanDto {
  @ApiProperty({ enum: ['approve', 'reject'] })
  @IsIn(['approve', 'reject'])
  action: 'approve' | 'reject';

  @ApiProperty({ example: 'Insufficient susu history', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
