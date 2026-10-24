import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { DataStoreService } from '../../data/data-store.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload, Role } from '../../data/types';

export interface AuthResult {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: Omit<import('../../data/types').ApiUser, 'passwordHash'>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly store: DataStoreService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private normalizePhone(input: string): string {
    const digits = input.replace(/\D/g, '');
    if (digits.length === 9 && !digits.startsWith('0')) return `0${digits}`;
    return digits;
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const phone = this.normalizePhone(dto.phone);
    const user = this.store.findUserByPhone(phone);
    if (!user || !user.passwordHash || !bcrypt.compareSync(dto.pin, user.passwordHash)) {
      throw new UnauthorizedException('Invalid phone number or PIN');
    }

    const payload: JwtPayload = { sub: user.id, phone: user.phone, role: user.role, name: user.name };
    const expiresIn = this.config.get<string>('jwtExpiresIn') || '12h';
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      user: this.store.sanitizeUser(user),
    };
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token);
  }

  hasRole(payload: JwtPayload, role: Role): boolean {
    return payload.role === role;
  }
}
