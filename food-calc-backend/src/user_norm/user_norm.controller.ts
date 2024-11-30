import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, BadRequestException, Req } from '@nestjs/common';
import { UserNormService } from './user_norm.service';
import { CreateUserNormDto } from './dto/create-user_norm.dto';
import { UpdateUserNormDto } from './dto/update-user_norm.dto';
import { LocalAuthGuard } from 'resources/auth/auth.guard';
import { Request } from 'express';

@Controller('user-norm')
export class UserNormController {
  constructor(private readonly userNormService: UserNormService) { }

  @UseGuards(LocalAuthGuard)
  @Post()
  create(@Body() createUserNormDto: CreateUserNormDto, @Req() request: Request) {
    const userId = request.user?.id
    if (userId == null) {
      throw new BadRequestException('No such user id');
    }
    return this.userNormService.create(userId, createUserNormDto);
  }
  @UseGuards(LocalAuthGuard)
  @Get()
  findAll() {
    return this.userNormService.findAll();
  }
  @UseGuards(LocalAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userNormService.findOne(+id);
  }
  @UseGuards(LocalAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserNormDto: UpdateUserNormDto, @Req() request: Request) {
    const userId = request.user?.id
    if (userId == null) {
      throw new BadRequestException('No such user id');
    }
    return this.userNormService.update(+id, userId, updateUserNormDto);
  }
  @UseGuards(LocalAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userNormService.remove(+id);
  }
}
