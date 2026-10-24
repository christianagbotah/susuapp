import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsString, Min } from 'class-validator';

export class ContributeDto {
  @ApiProperty({ example: 'grp-001' })
  @IsString()
  groupId: string;

  @ApiProperty({ example: 500, minimum: 1 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ enum: ['self', 'agent'], default: 'self', required: false })
  @IsIn(['self', 'agent'])
  collectedBy: 'self' | 'agent' = 'self';
}
