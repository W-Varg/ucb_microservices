import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload, logLevel } from 'kafkajs';

export interface TaskEvent {
  eventType: string;
  task?: any;
  taskId?: string;
  timestamp: string;
  instance: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
  lastUpdate: string;
}

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private isEnabled: boolean;
  
  // In-memory statistics cache (updated from Kafka events)
  private stats: TaskStats = {
    total: 0,
    completed: 0,
    pending: 0,
    byPriority: {
      high: 0,
      medium: 0,
      low: 0,
    },
    lastUpdate: new Date().toISOString(),
  };

  // Event history for debugging
  private eventHistory: TaskEvent[] = [];
  private readonly MAX_HISTORY = 100;

  constructor() {
    const kafkaBroker = process.env.KAFKA_BROKER || 'kafka:9092';
    const groupId = process.env.KAFKA_GROUP_ID || 'analytics-service-group';
    this.isEnabled = process.env.KAFKA_ENABLED === 'true';

    if (this.isEnabled) {
      this.logger.log('Initializing Kafka Consumer');
      this.kafka = new Kafka({
        clientId: 'analytics-service',
        brokers: [kafkaBroker],
        logLevel: logLevel.INFO,
        retry: {
          initialRetryTime: 300,
          retries: 10,
        },
      });

      this.consumer = this.kafka.consumer({
        groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
      });
    } else {
      this.logger.warn('Kafka is disabled');
    }
  }

  async onModuleInit() {
    if (!this.isEnabled) return;

    try {
      await this.consumer.connect();
      this.logger.log('✅ Kafka Consumer connected successfully');

      // Subscribe to all task-related topics
      await this.consumer.subscribe({
        topics: ['task-created', 'task-updated', 'task-deleted', 'task-events'],
        fromBeginning: false, // Only consume new messages
      });

      this.logger.log('📥 Subscribed to topics: task-created, task-updated, task-deleted, task-events');

      // Start consuming messages
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      this.logger.log('🎧 Kafka Consumer is now listening for messages...');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Kafka Consumer', error.message);
    }
  }

  async onModuleDestroy() {
    if (!this.isEnabled) return;

    try {
      await this.consumer.disconnect();
      this.logger.log('Kafka Consumer disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting Kafka Consumer', error.message);
    }
  }

  /**
   * Handle incoming Kafka messages
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      const event: TaskEvent = JSON.parse(message.value?.toString() || '{}');
      
      this.logger.log(
        `📨 Received event from topic '${topic}' (partition ${partition}): ${event.eventType}`
      );

      // Add to event history
      this.eventHistory.unshift(event);
      if (this.eventHistory.length > this.MAX_HISTORY) {
        this.eventHistory.pop();
      }

      // Process event and update statistics
      await this.processEvent(topic, event);
    } catch (error) {
      this.logger.error(`Failed to process message from topic '${topic}'`, error.message);
    }
  }

  /**
   * Process task event and update statistics
   */
  private async processEvent(topic: string, event: TaskEvent): Promise<void> {
    switch (topic) {
      case 'task-created':
        this.handleTaskCreated(event);
        break;
      case 'task-updated':
        this.handleTaskUpdated(event);
        break;
      case 'task-deleted':
        this.handleTaskDeleted(event);
        break;
      case 'task-events':
        this.logger.log(`Generic task event: ${event.eventType}`);
        break;
      default:
        this.logger.warn(`Unknown topic: ${topic}`);
    }

    this.stats.lastUpdate = new Date().toISOString();
  }

  /**
   * Handle task created event
   */
  private handleTaskCreated(event: TaskEvent): void {
    const task = event.task;
    if (!task) return;

    this.stats.total++;
    
    if (task.completed) {
      this.stats.completed++;
    } else {
      this.stats.pending++;
    }

    // Update priority count
    if (task.priority && this.stats.byPriority[task.priority] !== undefined) {
      this.stats.byPriority[task.priority]++;
    }

    this.logger.log(`✨ Task created - Total: ${this.stats.total}, Priority: ${task.priority}`);
  }

  /**
   * Handle task updated event
   */
  private handleTaskUpdated(event: TaskEvent): void {
    const task = event.task;
    if (!task) return;

    // Note: This is a simplified update. In a real scenario, you might need to
    // store task details to properly calculate differences
    this.logger.log(`🔄 Task updated - ID: ${event.taskId}`);
  }

  /**
   * Handle task deleted event
   */
  private handleTaskDeleted(event: TaskEvent): void {
    const task = event.task;
    if (!task) return;

    if (this.stats.total > 0) {
      this.stats.total--;
    }

    if (task.completed && this.stats.completed > 0) {
      this.stats.completed--;
    } else if (!task.completed && this.stats.pending > 0) {
      this.stats.pending--;
    }

    // Update priority count
    if (task.priority && this.stats.byPriority[task.priority] !== undefined) {
      if (this.stats.byPriority[task.priority] > 0) {
        this.stats.byPriority[task.priority]--;
      }
    }

    this.logger.log(`🗑️ Task deleted - Total: ${this.stats.total}`);
  }

  /**
   * Get current statistics from cache (Event-Driven)
   */
  getStats(): TaskStats {
    return {
      ...this.stats,
      lastUpdate: this.stats.lastUpdate,
    };
  }

  /**
   * Get event history
   */
  getEventHistory(limit = 20): TaskEvent[] {
    return this.eventHistory.slice(0, limit);
  }

  /**
   * Reset statistics (for testing purposes)
   */
  resetStats(): void {
    this.stats = {
      total: 0,
      completed: 0,
      pending: 0,
      byPriority: {
        high: 0,
        medium: 0,
        low: 0,
      },
      lastUpdate: new Date().toISOString(),
    };
    this.eventHistory = [];
    this.logger.log('Statistics reset');
  }
}
