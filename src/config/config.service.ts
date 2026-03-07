import { Injectable } from '@nestjs/common';
import { validateSync, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EnvironmentVariables } from './env.config';

@Injectable()
export class ConfigService {
  private readonly envConfig: EnvironmentVariables;

  constructor() {
    this.envConfig = this.validateConfig();
  }

  private validateConfig(): EnvironmentVariables {
    const config = plainToInstance(EnvironmentVariables, process.env, {
      enableImplicitConversion: true,
    });

    const errors: ValidationError[] = validateSync(config, {
      skipMissingProperties: false,
      forbidUnknownValues: false,
    });

    if (errors.length > 0) {
      const errorMessages = errors.map(error => {
        const constraints = error.constraints;
        return constraints ? Object.values(constraints).join(', ') : `${error.property} is invalid`;
      });

      throw new Error(`Environment validation failed:\n${errorMessages.join('\n')}`);
    }

    return config;
  }

  // Getters for environment variables
  get databaseUrl(): string {
    return this.envConfig.DATABASE_URL;
  }

  get jwtSecret(): string {
    return this.envConfig.JWT_SECRET || 'dev-secret-key';
  }

  get jwtRefreshSecret(): string {
    return this.envConfig.JWT_REFRESH_SECRET || this.jwtSecret;
  }

  get jwtExpiration(): string {
    return this.envConfig.JWT_EXPIRATION || '15m';
  }

  get redisHost(): string {
    return this.envConfig.REDIS_HOST || 'redis';
  }

  get redisPort(): number {
    return this.envConfig.REDIS_PORT || 6379;
  }

  get port(): number {
    return this.envConfig.PORT || 3000;
  }

  // Derived getters
  get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  get isDevelopment(): boolean {
    return process.env.NODE_ENV !== 'production';
  }
}