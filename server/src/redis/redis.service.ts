import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { REDIS_CLIENT, RedisClient } from './redis-client.type';
import { CreateLogDto } from 'src/log/dto/create-log.dto';
import { createClient } from 'redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private subscriber: RedisClient;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
    private readonly configService: ConfigService,
  ) {
    this.initializeSubscriber();
  }

  private async initializeSubscriber() {
    this.subscriber = createClient({
      url: this.configService.get<string>('REDIS_URL'),
    });

    await this.subscriber.connect();
    await this.subscriber.subscribe('new_logs', () => this.processLogs());
  }

  async onModuleDestroy() {
    await this.redis.quit();
    await this.subscriber.quit();
  }

  ping() {
    return this.redis.ping();
  }

  async addLogToQueue(data: CreateLogDto) {
    await this.redis.rPush('log_queue', JSON.stringify(data));
    await this.redis.publish('new_logs', 'logs_available');
  }

  private async processLogs() {
    const batchSize = 100;
    let processedCount = 0;

    while (true) {
      const logs = await this.redis.lRange('log_queue', 0, batchSize - 1);

      if (logs.length === 0) {
        break;
      }

      if (logs.length > 0) {
        const logEntities = logs.map((log) => JSON.parse(log));
        console.log('Logs length:', logEntities.length);

        try {
          // Save logs to database in batch
          //   await Promise.all(
          //     logEntities.map((log) => this.logService.create(log)),
          //   );

          // Remove processed logs from queue
          await this.redis.lTrim('log_queue', batchSize, -1);
        } catch (error) {
          console.error('Error processing logs:', error);
          // In case of error, we might want to implement retry logic or dead letter queue
        }
        processedCount += logs.length;
      }
      console.log('Processed count:', processedCount);
    }
  }

  clear() {
    return this.redis.flushAll();
  }
}
