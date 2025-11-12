import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, logLevel } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private isEnabled: boolean;

  constructor() {
    const kafkaBroker = process.env.KAFKA_BROKER || 'kafka:9092';
    const instanceName = process.env.INSTANCE_NAME || 'tasks-service';
    this.isEnabled = process.env.KAFKA_ENABLED === 'true';

    if (this.isEnabled) {
      this.logger.log(`Initializing Kafka client for ${instanceName}`);
      this.kafka = new Kafka({
        clientId: instanceName,
        brokers: [kafkaBroker],
        logLevel: logLevel.INFO,
        retry: {
          initialRetryTime: 300,
          retries: 10,
        },
      });

      this.producer = this.kafka.producer({
        allowAutoTopicCreation: false,
        transactionTimeout: 30000,
      });
    } else {
      this.logger.warn('Kafka is disabled');
    }
  }

  async onModuleInit() {
    if (!this.isEnabled) return;

    try {
      await this.producer.connect();
      this.logger.log('✅ Kafka Producer connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect Kafka Producer', error.message);
    }
  }

  async onModuleDestroy() {
    if (!this.isEnabled) return;

    try {
      await this.producer.disconnect();
      this.logger.log('Kafka Producer disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting Kafka Producer', error.message);
    }
  }

  /**
   * Publish an event to a Kafka topic
   */
  async publishEvent(topic: string, event: any): Promise<void> {
    if (!this.isEnabled) {
      this.logger.debug(`Kafka disabled - Event not published to ${topic}`);
      return;
    }

    try {
      const message = {
        value: JSON.stringify({
          ...event,
          timestamp: new Date().toISOString(),
          instance: process.env.INSTANCE_NAME,
        }),
      };

      await this.producer.send({
        topic,
        messages: [message],
      });

      this.logger.log(`📤 Event published to topic '${topic}': ${event.eventType}`);
    } catch (error) {
      this.logger.error(`Failed to publish event to topic '${topic}'`, error.message);
      throw error;
    }
  }

  /**
   * Publish task created event
   */
  async publishTaskCreated(task: any): Promise<void> {
    await this.publishEvent('task-created', {
      eventType: 'TASK_CREATED',
      task,
    });
  }

  /**
   * Publish task updated event
   */
  async publishTaskUpdated(taskId: string, task: any): Promise<void> {
    await this.publishEvent('task-updated', {
      eventType: 'TASK_UPDATED',
      taskId,
      task,
    });
  }

  /**
   * Publish task deleted event
   */
  async publishTaskDeleted(taskId: string, task: any): Promise<void> {
    await this.publishEvent('task-deleted', {
      eventType: 'TASK_DELETED',
      taskId,
      task,
    });
  }

  /**
   * Publish generic task event
   */
  async publishTaskEvent(eventType: string, data: any): Promise<void> {
    await this.publishEvent('task-events', {
      eventType,
      data,
    });
  }
}
