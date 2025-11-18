import { Controller, Get, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@ApiTags('analytics')
@Controller('api/analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stats')
  @ApiOperation({ 
    summary: 'Obtener estadísticas de tareas',
    description: 'Obtiene estadísticas desde HTTP (síncrono) y Kafka (asíncrono)'
  })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getStats(@Request() req) {
    return this.analyticsService.getStats();
  }

  @Get('stats/sync')
  @ApiOperation({ 
    summary: 'Obtener estadísticas via HTTP (Síncrono)',
    description: 'Usa comunicación HTTP con patrones Retry + Circuit Breaker'
  })
  @ApiResponse({ status: 200, description: 'Estadísticas HTTP obtenidas' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getStatsSync(@Request() req) {
    return this.analyticsService.getStatsSync();
  }

  @Get('stats/event-driven')
  @ApiOperation({ 
    summary: 'Obtener estadísticas via Kafka (Event-Driven)',
    description: 'Obtiene estadísticas del caché actualizado por eventos de Kafka'
  })
  @ApiResponse({ status: 200, description: 'Estadísticas de eventos obtenidas' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  getStatsEventDriven(@Request() req) {
    return this.analyticsService.getStatsEventDriven();
  }

  @Get('tasks-by-priority')
  @ApiOperation({ summary: 'Obtener tareas agrupadas por prioridad (HTTP)' })
  @ApiResponse({ status: 200, description: 'Tareas agrupadas obtenidas exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getTasksByPriority(@Request() req) {
    return this.analyticsService.getTasksByPriority();
  }

  @Get('events')
  @ApiOperation({ 
    summary: 'Obtener historial de eventos de Kafka',
    description: 'Muestra los últimos eventos procesados desde Kafka'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número de eventos (default: 20)' })
  @ApiResponse({ status: 200, description: 'Historial de eventos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  getEventHistory(@Query('limit') limit?: number, @Request() req?) {
    return this.analyticsService.getEventHistory(limit ? parseInt(limit.toString()) : 20);
  }

  @Get('circuit-breaker')
  @ApiOperation({ summary: 'Obtener estado del Circuit Breaker' })
  @ApiResponse({ status: 200, description: 'Estado del circuit breaker' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  getCircuitBreakerStatus(@Request() req) {
    return this.analyticsService.getCircuitBreakerStatus();
  }

  @Post('circuit-breaker/reset')
  @ApiOperation({ summary: 'Reiniciar el Circuit Breaker' })
  @ApiResponse({ status: 200, description: 'Circuit breaker reiniciado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  resetCircuitBreaker(@Request() req) {
    return this.analyticsService.resetCircuitBreaker();
  }
}

