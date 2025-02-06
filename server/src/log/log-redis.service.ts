import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { REDIS_CLIENT, RedisClient } from '../redis/redis-client.type';
import { CreateLogDto } from './dto/create-log.dto';
import { createClient } from 'redis';
import { ConfigService } from '@nestjs/config';
import { LogService } from './log.service';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@Injectable()
@WebSocketGateway({
  namespace: 'logs',
  cors: {
    origin: '*',
  },
})
export class LogRedisService
  implements OnModuleDestroy, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() private server: Server;
  private subscriber: RedisClient;
  private connectedClients: Set<string> = new Set();

  private readonly LOG_QUEUE = 'log_queue';
  private readonly LOG_CHANNEL = 'new_logs';
  private readonly DEAD_LETTER_QUEUE = 'dead_letter_queue';
  private readonly BATCH_SIZE = 100;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
    private readonly configService: ConfigService,
    private readonly logService: LogService,
  ) {
    this.initializeSubscriber();
  }

  // WebSocket connection handler
  handleConnection(client: Socket) {
    this.connectedClients.add(client.id);
    console.log(`Client connected: ${client.id}`);
    client.emit('connection_status', {
      status: 'connected',
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  // WebSocket disconnection handler
  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    console.log(`Client disconnected: ${client.id}`);
  }

  // Handle client subscription to log updates
  @SubscribeMessage('subscribe_logs')
  handleSubscribeLogs(client: Socket) {
    client.join('log_updates');
    return { event: 'subscribe_logs', data: { status: 'subscribed' } };
  }

  // Handle client unsubscription from log updates
  @SubscribeMessage('unsubscribe_logs')
  handleUnsubscribeLogs(client: Socket) {
    client.leave('log_updates');
    return { event: 'unsubscribe_logs', data: { status: 'unsubscribed' } };
  }

  // Handle client requesting queue stats
  @SubscribeMessage('get_queue_stats')
  async handleQueueStats() {
    const stats = await this.getQueueStats();
    return { event: 'queue_stats', data: stats };
  }

  private async initializeSubscriber() {
    this.subscriber = createClient({
      url: this.configService.get<string>('REDIS_URL'),
    });

    await this.subscriber.connect();
    await this.subscriber.subscribe(this.LOG_CHANNEL, () => this.processLogs());
  }

  async onModuleDestroy() {
    await this.redis.quit();
    await this.subscriber?.quit();
  }

  async addLogToQueue(data: CreateLogDto) {
    try {
      await this.redis.rPush(this.LOG_QUEUE, JSON.stringify(data));
      await this.redis.publish(this.LOG_CHANNEL, 'logs_available');

      // Notify all subscribed clients about new log
      this.server.to('log_updates').emit('log_queued', {
        status: 'queued',
        timestamp: new Date().toISOString(),
        data,
      });

      return { success: true, message: 'Log added to queue' };
    } catch (error) {
      console.error('Error adding log to queue:', error);
      throw new Error('Failed to queue log');
    }
  }

  private async processLogs() {
    let processedCount = 0;
    console.log('Starting log processing...');

    while (true) {
      const logs = await this.redis.lRange(
        this.LOG_QUEUE,
        0,
        this.BATCH_SIZE - 1,
      );

      if (logs.length === 0) {
        this.server.to('log_updates').emit('processing_complete', {
          totalProcessed: processedCount,
          timestamp: new Date().toISOString(),
        });
        break;
      }

      const logEntities = logs.map((log) => JSON.parse(log) as CreateLogDto);

      try {
        // Save logs to database in batch
        const savedLogs = await Promise.all(
          logEntities.map((log) => this.logService.create(log)),
        );

        // Notify subscribed clients about processed logs
        this.server.to('log_updates').emit('logs_processed', {
          count: savedLogs.length,
          logs: savedLogs,
          timestamp: new Date().toISOString(),
        });

        // Remove processed logs from queue
        await this.redis.lTrim(this.LOG_QUEUE, logs.length, -1);

        processedCount += logs.length;

        // Emit progress update
        this.server.to('log_updates').emit('processing_progress', {
          processed: processedCount,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error processing logs batch:', error);
        await this.moveToDeadLetterQueue(logEntities);

        // Notify about processing error
        this.server.to('log_updates').emit('processing_error', {
          error: 'Failed to process logs batch',
          count: logEntities.length,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  private async moveToDeadLetterQueue(failedLogs: CreateLogDto[]) {
    try {
      const deadLetterEntries = failedLogs.map((log) => ({
        log,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        error: 'Failed to process in batch',
      }));

      await Promise.all(
        deadLetterEntries.map((entry) =>
          this.redis.rPush(this.DEAD_LETTER_QUEUE, JSON.stringify(entry)),
        ),
      );
      console.log(`Moved ${failedLogs.length} logs to dead letter queue`);
    } catch (error) {
      console.error('Error moving to dead letter queue:', error);
    }
  }

  async retryDeadLetterQueue() {
    const deadLogs = await this.redis.lRange(this.DEAD_LETTER_QUEUE, 0, -1);

    if (deadLogs.length === 0) {
      return { message: 'No logs in dead letter queue' };
    }

    let successCount = 0;
    let failCount = 0;

    for (const deadLog of deadLogs) {
      const entry = JSON.parse(deadLog);

      try {
        await this.addLogToQueue(entry.log);
        await this.redis.lRem(this.DEAD_LETTER_QUEUE, 1, deadLog);
        successCount++;
      } catch (error) {
        failCount++;
        console.error('Failed to retry dead letter log:', error);
      }
    }

    return {
      message: 'Dead letter queue retry completed',
      success: successCount,
      failed: failCount,
    };
  }

  async getQueueStats() {
    const [queueLength, deadLetterLength] = await Promise.all([
      this.redis.lLen(this.LOG_QUEUE),
      this.redis.lLen(this.DEAD_LETTER_QUEUE),
    ]);

    return {
      queueLength,
      deadLetterLength,
      timestamp: new Date().toISOString(),
    };
  }

  async clearQueues() {
    await Promise.all([
      this.redis.del(this.LOG_QUEUE),
      this.redis.del(this.DEAD_LETTER_QUEUE),
    ]);
    return { message: 'All queues cleared' };
  }
}
