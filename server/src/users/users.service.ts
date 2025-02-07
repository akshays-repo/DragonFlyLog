import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// This should be a real class/interface representing a user entity

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(username: string): Promise<User | undefined> {
    return await this.userRepository.findOne({ where: { username } });
  }

  async create(username: string, password: string): Promise<User> {
    return await this.userRepository.save({
      username,
      password,
    });
  }

  async update(user: User): Promise<User> {
    await this.userRepository.update(user.id, user);
    return await this.findOne(user.username);
  }

  async remove(username: string): Promise<void> {
    await this.userRepository.delete(username);
  }
}
