import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Get(':username')
  async findByUserName(@Param('username') username: string, @Req() req: any) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const authUser = req?.user as any;
    if (authUser.username !== username) {
      throw new UnauthorizedException('invalid username');
    }

    const user = await this.userService.findOne(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      username: user.username,
      email: user.email,
      isActive: user.isActive,
    };
  }
}
