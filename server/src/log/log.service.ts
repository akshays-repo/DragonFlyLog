import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from './entities/log.entity';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class LogService {
  constructor(
    @InjectRepository(Log)
    private readonly logRepository: Repository<Log>,
    private readonly redisService: RedisService,
  ) {}

  async moveLogToRedis(createLogDto: CreateLogDto) {
    await this.redisService.addLogToQueue(createLogDto);
    return { message: 'Log received and queued for processing' };
  }

  async create(createLogDto: CreateLogDto): Promise<Log> {
    const log = this.logRepository.create(createLogDto);
    return await this.logRepository.save(log);
  }

  async findAll(): Promise<Log[]> {
    return await this.logRepository.find({ order: { timestamp: 'DESC' } });
  }

  async findOne(id: number): Promise<Log> {
    const log = await this.logRepository.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException(`Log with ID ${id} not found`);
    }
    return log;
  }

  async update(id: number, updateLogDto: UpdateLogDto): Promise<Log> {
    await this.findOne(id); // Ensure the log exists
    await this.logRepository.update(id, updateLogDto);
    return this.findOne(id); // Return the updated log
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Ensure the log exists
    await this.logRepository.delete(id);
  }
}
