import { Module } from '@nestjs/common';
import { LogService } from './log.service';
import { LogController } from './log.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log } from './entities/log.entity';
import { RedisModule } from 'src/redis/redis.module';
import { LogRedisController } from './log-redis.controller';
import { LogRedisService } from './log-redis.service';
import { ConfigModule } from '@nestjs/config';
import { redisClientFactory } from 'src/redis/redis-client.factory';

@Module({
  imports: [TypeOrmModule.forFeature([Log]), RedisModule, ConfigModule],
  controllers: [LogController, LogRedisController],
  providers: [LogService, LogRedisService, redisClientFactory],
  exports: [LogService, LogRedisService],
})
export class LogModule {}
