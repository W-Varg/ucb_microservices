import { Injectable, Logger } from '@nestjs/common';
import { HttpClientService } from '../common/http-client.service';
import { KafkaConsumerService } from '../kafka/kafka-consumer.service';

export interface Task {
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

  constructor(
    private readonly httpClient: HttpClientService,
    private readonly kafkaConsumer: KafkaConsumerService,
  ) {
    this.tasksServiceUrl = process.env.TASKS_SERVICE_URL || 'http://nginx-lb';
  }

  /**
   * Get general statistics from Tasks Service (HTTP - Synchronous)
   * This demonstrates the synchronous communication with Retry + Circuit Breaker
   */
  async getStatsSync() {
    this.logger.log('Fetching statistics from Tasks Service via HTTP (Synchronous)');
    
    try {
      const tasks = await this.httpClient.get<Task[]>(
        `${this.tasksServiceUrl}/api/tasks`,
        3, // 3 retries
        1000 // 1 second initial delay
      );

      const stats = {
        source: 'HTTP (Synchronous)',
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

      this.logger.log(`Statistics calculated via HTTP: ${stats.total} total tasks`);
      return stats;
    } catch (error) {
      this.logger.error('Failed to fetch statistics via HTTP', error.message);
      return {
        source: 'HTTP (Synchronous)',
        error: 'Failed to fetch statistics from Tasks Service',
        message: error.message,
        circuitBreakerState: this.httpClient.getCircuitState(),
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get statistics from Kafka events (Event-Driven - Asynchronous)
   * This demonstrates asynchronous event-driven architecture
   */
  getStatsEventDriven() {
    this.logger.log('Getting statistics from Kafka events (Event-Driven)');
    const stats = this.kafkaConsumer.getStats();
    
    return {
      source: 'Kafka Events (Asynchronous)',
      ...stats,
      completionRate: stats.total > 0 
        ? ((stats.completed / stats.total) * 100).toFixed(2) + '%'
        : '0%',
    };
  }

  /**
   * Get combined statistics from both sources
   */
  async getStats() {
    this.logger.log('Getting combined statistics from both HTTP and Kafka');
    
    const [syncStats, eventDrivenStats] = await Promise.allSettled([
      this.getStatsSync(),
      Promise.resolve(this.getStatsEventDriven()),
    ]);

    return {
      synchronous: syncStats.status === 'fulfilled' ? syncStats.value : { error: 'Failed to fetch' },
      eventDriven: eventDrivenStats.status === 'fulfilled' ? eventDrivenStats.value : { error: 'Failed to fetch' },
      note: 'Synchronous uses HTTP with Retry+CircuitBreaker. EventDriven uses Kafka messages.',
    };
  }

  /**
   * Get tasks grouped by priority (HTTP - Synchronous)
   */
  async getTasksByPriority() {
    this.logger.log('Fetching tasks by priority from Tasks Service via HTTP');
    
    try {
      const tasks = await this.httpClient.get<Task[]>(
        `${this.tasksServiceUrl}/api/tasks`,
        3,
        1000
      );

      const grouped = {
        source: 'HTTP (Synchronous)',
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
        source: 'HTTP (Synchronous)',
        error: 'Failed to fetch tasks by priority from Tasks Service',
        message: error.message,
        circuitBreakerState: this.httpClient.getCircuitState(),
      };
    }
  }

  /**
   * Get event history from Kafka consumer
   */
  getEventHistory(limit = 20) {
    this.logger.log('Getting event history from Kafka consumer');
    return {
      source: 'Kafka Events',
      events: this.kafkaConsumer.getEventHistory(limit),
      timestamp: new Date().toISOString(),
    };
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
