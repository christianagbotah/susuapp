import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Registers JwtService globally so guards (JwtAuthGuard) and services
 * can inject it in any feature module.
 */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwtSecret'),
      }),
    }),
  ],
  exports: [JwtModule],
})
export class GlobalJwtModule {}
