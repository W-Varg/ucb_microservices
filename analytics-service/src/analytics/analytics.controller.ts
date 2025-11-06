import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas generales de tareas' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  async getStats() {
    return this.analyticsService.getStats();
  }

  @Get('tasks-by-priority')
  @ApiOperation({ summary: 'Obtener tareas agrupadas por prioridad' })
  @ApiResponse({ status: 200, description: 'Tareas agrupadas obtenidas exitosamente' })
  async getTasksByPriority() {
    return this.analyticsService.getTasksByPriority();
  }

  @Get('circuit-breaker')
  @ApiOperation({ summary: 'Obtener estado del Circuit Breaker' })
  @ApiResponse({ status: 200, description: 'Estado del circuit breaker' })
  getCircuitBreakerStatus() {
    return this.analyticsService.getCircuitBreakerStatus();
  }

  @Post('circuit-breaker/reset')
  @ApiOperation({ summary: 'Reiniciar el Circuit Breaker' })
  @ApiResponse({ status: 200, description: 'Circuit breaker reiniciado' })
  resetCircuitBreaker() {
    return this.analyticsService.resetCircuitBreaker();
  }
}
