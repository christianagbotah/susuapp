import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '0241234567', description: 'Ghana phone number (10 digits, local format)' })
  @IsString()
  @Matches(/^[0-9+\s]{9,13}$/, { message: 'phone must be a valid Ghana phone number' })
  phone: string;

  @ApiProperty({ example: '123456', minLength: 4, maxLength: 6 })
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  pin: string;
}
