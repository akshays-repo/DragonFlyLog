import { Controller, Delete, Get, Post } from '@nestjs/common';
import { LogRedisService } from './log-redis.service';

@Controller('logs/queue')
export class LogRedisController {
  constructor(private readonly logRedisService: LogRedisService) {}

  @Get('stats')
  getQueueStats() {
    return this.logRedisService.getQueueStats();
  }

  @Post('retry')
  retryDeadLetterQueue() {
    return this.logRedisService.retryDeadLetterQueue();
  }

  @Delete()
  clearQueues() {
    return this.logRedisService.clearQueues();
  }
}
