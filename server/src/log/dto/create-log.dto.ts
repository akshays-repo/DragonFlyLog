import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export class CreateLogDto {
  @IsString()
  message: string;

  @IsString()
  source: string; // e.g., 'frontend', 'backend', 'service-name'

  @IsEnum(['info', 'warn', 'error', 'debug'])
  level: 'info' | 'warn' | 'error' | 'debug';

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>; // Optional additional data
}
