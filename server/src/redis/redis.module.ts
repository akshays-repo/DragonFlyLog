import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { redisClientFactory } from './redis-client.factory';
import { RedisService } from './redis.service';
import { RedisHealthIndicator } from './redis-health-indicator.service';
import { RedisController } from './redis.controller';

@Module({
  imports: [ConfigModule],
  providers: [redisClientFactory, RedisService, RedisHealthIndicator],
  exports: [RedisService, RedisHealthIndicator],
  controllers: [RedisController],
})
export class RedisModule {}
