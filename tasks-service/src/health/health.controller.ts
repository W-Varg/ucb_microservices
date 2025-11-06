import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check del servicio' })
  @ApiResponse({ status: 200, description: 'Servicio saludable' })
  getHealth() {
    return this.healthService.getHealth();
  }
}
