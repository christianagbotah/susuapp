import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DataModule } from './data/data.module';
import { GlobalJwtModule } from './common/global-jwt.module';
import { HealthController } from './modules/health/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { SusuModule } from './modules/susu/susu.module';
import { LoansModule } from './modules/loans/loans.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    DataModule,
    GlobalJwtModule,
    AuthModule,
    UsersModule,
    WalletsModule,
    TransactionsModule,
    SusuModule,
    LoansModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
