import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AnalyticsModule } from './analytics/analytics.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    AnalyticsModule,
    HealthModule,
  ],
})
export class AppModule {}
