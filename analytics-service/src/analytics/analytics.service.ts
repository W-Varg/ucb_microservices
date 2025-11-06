import { Injectable, Logger } from '@nestjs/common';
import { HttpClientService } from '../common/http-client.service';

interface Task {
  _id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly tasksServiceUrl: string;

  constructor(private readonly httpClient: HttpClientService) {
    this.tasksServiceUrl = process.env.TASKS_SERVICE_URL || 'http://nginx-lb';
  }

  /**
   * Get general statistics from Tasks Service
   */
  async getStats() {
    this.logger.log('Fetching statistics from Tasks Service');
    
    try {
      const tasks = await this.httpClient.get<Task[]>(
        `${this.tasksServiceUrl}/api/tasks`,
        3, // 3 retries
        1000 // 1 second initial delay
      );

      const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.completed).length,
        pending: tasks.filter(t => !t.completed).length,
        byPriority: {
          high: tasks.filter(t => t.priority === 'high').length,
          medium: tasks.filter(t => t.priority === 'medium').length,
          low: tasks.filter(t => t.priority === 'low').length,
        },
        completionRate: tasks.length > 0 
          ? ((tasks.filter(t => t.completed).length / tasks.length) * 100).toFixed(2) + '%'
          : '0%',
        circuitBreakerState: this.httpClient.getCircuitState(),
        timestamp: new Date().toISOString(),
      };

      this.logger.log(`Statistics calculated: ${stats.total} total tasks`);
      return stats;
    } catch (error) {
      this.logger.error('Failed to fetch statistics', error.message);
      return {
        error: 'Failed to fetch statistics from Tasks Service',
        message: error.message,
        circuitBreakerState: this.httpClient.getCircuitState(),
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get tasks grouped by priority
   */
  async getTasksByPriority() {
    this.logger.log('Fetching tasks by priority from Tasks Service');
    
    try {
      const tasks = await this.httpClient.get<Task[]>(
        `${this.tasksServiceUrl}/api/tasks`,
        3,
        1000
      );

      const grouped = {
        high: tasks.filter(t => t.priority === 'high'),
        medium: tasks.filter(t => t.priority === 'medium'),
        low: tasks.filter(t => t.priority === 'low'),
        summary: {
          high: tasks.filter(t => t.priority === 'high').length,
          medium: tasks.filter(t => t.priority === 'medium').length,
          low: tasks.filter(t => t.priority === 'low').length,
        },
        circuitBreakerState: this.httpClient.getCircuitState(),
      };

      return grouped;
    } catch (error) {
      this.logger.error('Failed to fetch tasks by priority', error.message);
      return {
        error: 'Failed to fetch tasks by priority from Tasks Service',
        message: error.message,
        circuitBreakerState: this.httpClient.getCircuitState(),
      };
    }
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus() {
    return {
      state: this.httpClient.getCircuitState(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker() {
    this.httpClient.resetCircuit();
    return {
      message: 'Circuit breaker reset successfully',
      state: this.httpClient.getCircuitState(),
      timestamp: new Date().toISOString(),
    };
  }
}
