import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { LogService } from './log.service';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';
import { LogRedisService } from './log-redis.service';

@Controller('log')
export class LogController {
  constructor(
    private readonly logService: LogService,
    private readonly logRedisService: LogRedisService,
  ) {}

  @Post()
  create(@Body() createLogDto: CreateLogDto) {
    return this.logRedisService.addLogToQueue(createLogDto);
  }

  @Get()
  async findAll() {
    return this.logService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.logService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLogDto: UpdateLogDto) {
    return this.logService.update(+id, updateLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.logService.remove(+id);
  }
}
