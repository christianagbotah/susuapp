import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class TransferDto {
  @ApiProperty({ example: '0209876543' })
  @IsString()
  recipientPhone: string;

  @ApiProperty({ example: 200, minimum: 1 })
  @IsNumber()
  @Min(1, { message: 'amount must be at least ₵1' })
  amount: number;

  @ApiProperty({ example: 'Lunch money', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
