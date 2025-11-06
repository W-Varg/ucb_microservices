import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class HealthService {
  constructor(@InjectConnection() private connection: Connection) {}

  getHealth() {
    const mongoStatus = this.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    return {
      status: 'OK',
      service: 'Tasks Service (Servicio A)',
      mongodb: mongoStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      instance: process.env.INSTANCE_NAME || 'tasks-service',
    };
  }
}
