import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { HttpClientService } from '../common/http-client.service';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    KafkaModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, HttpClientService],
})
export class AnalyticsModule {}
