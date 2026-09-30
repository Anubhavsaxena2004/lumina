import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MastersModule } from './masters/masters.module';
import { SalesModule } from './sales/sales.module';
import { PurchasesModule } from './purchases/purchases.module';
import { JobWorkModule } from './job-work/job-work.module';
import { VouchersModule } from './vouchers/vouchers.module';
import { LedgerModule } from './ledger/ledger.module';
import { StockModule } from './stock/stock.module';
import { AuditModule } from './audit/audit.module';
import { HealthController } from './health/health.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { SanitizeInputInterceptor } from './common/interceptors/sanitize-input.interceptor';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    MastersModule,
    SalesModule,
    PurchasesModule,
    JobWorkModule,
    VouchersModule,
    LedgerModule,
    StockModule,
    AuditModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SanitizeInputInterceptor,
    },
  ],
})
export class AppModule {}
