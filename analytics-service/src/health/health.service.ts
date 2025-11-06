import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHealth() {
    return {
      status: 'OK',
      service: 'Analytics Service (Servicio B)',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
