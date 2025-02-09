import { Injectable } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: number) {
    return await this.projectRepository.save({
      name: createProjectDto.name,
      apiToken: '****',
      user: {
        id: userId,
      },
    });
  }

  async findAll(userId: number) {
    return await this.projectRepository.find({
      where: { user: { id: userId } },
      select: {
        name: true,
      },
    });
  }

  async findOne(id: string) {
    return await this.projectRepository.findOne({
      where: {
        id,
      },
    });
  }

  update(id: number, updateProjectDto: UpdateProjectDto) {
    return `This action updates a #${id} project`;
  }

  remove(id: number) {
    return `This action removes a #${id} project`;
  }
}
