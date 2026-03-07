import { IsString, IsNumber, IsUrl, Min, Max, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class EnvironmentVariables {
  // Database
  @IsString( { message: 'DATABASE_URL must be a valid PostgreSQL connection URL' })
  DATABASE_URL: string;

  // JWT Configuration
  @IsString()
  @IsOptional()
  JWT_SECRET?: string = 'dev-secret-key';

  @IsString()
  @IsOptional()
  JWT_REFRESH_SECRET?: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRATION?: string = '15m';

  // Redis Configuration
  @IsString()
  @IsOptional()
  REDIS_HOST?: string = 'redis';

  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  REDIS_PORT?: number = 6379;

  // Application
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT?: number = 3000;
}