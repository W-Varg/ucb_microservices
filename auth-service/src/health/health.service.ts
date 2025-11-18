import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";

@Injectable()
export class HealthService {
  constructor(@InjectConnection() private connection: Connection) {}

  check() {
    return {
      status: "UP",
      timestamp: new Date().toISOString(),
      service: "auth-service",
      database: this.connection.readyState === 1 ? "connected" : "disconnected",
    };
  }
}
