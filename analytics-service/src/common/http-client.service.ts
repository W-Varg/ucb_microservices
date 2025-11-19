import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, retry, delay, tap, timeout } from 'rxjs/operators';
import { lastValueFrom, throwError, of } from 'rxjs';
import { AxiosError } from 'axios';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);
  
  // Circuit Breaker Configuration
  private circuitState: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private readonly failureThreshold = 3; // Open circuit after 3 failures
  private readonly resetTimeout = 30000; // 30 seconds
  private lastFailureTime: number = 0;
  private successCount = 0;
  private readonly successThreshold = 2; // Close circuit after 2 successes in HALF_OPEN

  // JWT Token for service-to-service communication
  private serviceToken: string;

  constructor(private readonly httpService: HttpService) {
    // Initialize service token (this should be obtained from Auth Service)
    this.initializeServiceToken();
  }

  /**
   * Initialize service token for inter-service communication
   */
  private async initializeServiceToken(): Promise<void> {
    try {
      // For now, we'll create a simple token. In production, this should login to Auth Service
      // This is a temporary solution - ideally, Analytics Service should authenticate with Auth Service
      const jwt = require('jsonwebtoken');
      const jwtSecret = process.env.JWT_SECRET || 'mi_clave_secreta_jwt_super_segura_2024';
      
      this.serviceToken = jwt.sign(
        {
          sub: 'analytics-service',
          service: 'analytics',
          roles: ['service'],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        },
        jwtSecret
      );
      
      this.logger.log('🔑 Service token initialized for inter-service communication');
    } catch (error) {
      this.logger.error('Failed to initialize service token', error);
    }
  }

  /**
   * Make HTTP GET request with Retry Pattern and Circuit Breaker
   */
  async get<T>(url: string, retries = 3, retryDelay = 1000): Promise<T> {
    return this.executeWithCircuitBreaker(
      () => this.makeRequest<T>('GET', url, retries, retryDelay),
      url
    );
  }

  /**
   * Execute request with Circuit Breaker protection
   */
  private async executeWithCircuitBreaker<T>(
    request: () => Promise<T>,
    url: string
  ): Promise<T> {
    // Check circuit state
    if (this.circuitState === CircuitState.OPEN) {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.resetTimeout) {
        this.logger.log('Circuit transitioning to HALF_OPEN state');
        this.circuitState = CircuitState.HALF_OPEN;
      } else {
        const error = new Error('Circuit breaker is OPEN - request blocked');
        this.logger.error(`❌ Circuit OPEN: ${url}`);
        throw error;
      }
    }

    try {
      const result = await request();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    method: string,
    url: string,
    retries: number,
    retryDelay: number
  ): Promise<T> {
    this.logger.log(`Making ${method} request to: ${url}`);
    
    // Prepare headers with service token
    const headers = {
      'Authorization': `Bearer ${this.serviceToken}`,
      'Content-Type': 'application/json'
    };
    
    const request$ = this.httpService.get<T>(url, { headers }).pipe(
      timeout(5000), // 5 second timeout
      retry({
        count: retries,
        delay: (error, retryCount) => {
          const backoffDelay = retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff
          this.logger.warn(
            `Retry attempt ${retryCount}/${retries} for ${url} after ${backoffDelay}ms`
          );
          return of(error).pipe(delay(backoffDelay));
        },
      }),
      tap((response) => {
        this.logger.log(`✅ Success: ${method} ${url} - Status: ${response.status}`);
      }),
      catchError((error: AxiosError) => {
        this.logger.error(
          `❌ Request failed after ${retries} retries: ${url}`,
          error.message
        );
        return throwError(() => error);
      })
    );

    try {
      const response = await lastValueFrom(request$);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch data from ${url}: ${error.message}`);
    }
  }

  /**
   * Handle successful request
   */
  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.logger.log('✅ Circuit transitioning to CLOSED state');
        this.circuitState = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  /**
   * Handle failed request
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.logger.warn('⚠️ Circuit transitioning back to OPEN state');
      this.circuitState = CircuitState.OPEN;
    } else if (this.failureCount >= this.failureThreshold) {
      this.logger.error('🔴 Circuit transitioning to OPEN state - Too many failures');
      this.circuitState = CircuitState.OPEN;
    }
  }

  /**
   * Get current circuit breaker state
   */
  getCircuitState(): CircuitState {
    return this.circuitState;
  }

  /**
   * Reset circuit breaker
   */
  resetCircuit(): void {
    this.circuitState = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.logger.log('Circuit breaker manually reset to CLOSED state');
  }
}
