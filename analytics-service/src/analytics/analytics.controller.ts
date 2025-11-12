import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stats')
  @ApiOperation({ 
    summary: 'Obtener estadísticas de tareas',
    description: 'Obtiene estadísticas desde HTTP (síncrono) y Kafka (asíncrono)'
  })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  async getStats() {
    return this.analyticsService.getStats();
  }

  @Get('stats/sync')
  @ApiOperation({ 
    summary: 'Obtener estadísticas via HTTP (Síncrono)',
    description: 'Usa comunicación HTTP con patrones Retry + Circuit Breaker'
  })
  @ApiResponse({ status: 200, description: 'Estadísticas HTTP obtenidas' })
  async getStatsSync() {
    return this.analyticsService.getStatsSync();
  }

  @Get('stats/event-driven')
  @ApiOperation({ 
    summary: 'Obtener estadísticas via Kafka (Event-Driven)',
    description: 'Obtiene estadísticas del caché actualizado por eventos de Kafka'
  })
  @ApiResponse({ status: 200, description: 'Estadísticas de eventos obtenidas' })
  getStatsEventDriven() {
    return this.analyticsService.getStatsEventDriven();
  }

  @Get('tasks-by-priority')
  @ApiOperation({ summary: 'Obtener tareas agrupadas por prioridad (HTTP)' })
  @ApiResponse({ status: 200, description: 'Tareas agrupadas obtenidas exitosamente' })
  async getTasksByPriority() {
    return this.analyticsService.getTasksByPriority();
  }

  @Get('events')
  @ApiOperation({ 
    summary: 'Obtener historial de eventos de Kafka',
    description: 'Muestra los últimos eventos procesados desde Kafka'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número de eventos (default: 20)' })
  @ApiResponse({ status: 200, description: 'Historial de eventos' })
  getEventHistory(@Query('limit') limit?: number) {
    return this.analyticsService.getEventHistory(limit ? parseInt(limit.toString()) : 20);
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

