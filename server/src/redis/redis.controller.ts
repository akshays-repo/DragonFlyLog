import { Controller, Get } from '@nestjs/common';
import { RedisService } from './redis.service';

@Controller('redis')
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  // Clear all data in Redis
  @Get('clear')
  clear() {
    return this.redisService.clear();
  }
}
