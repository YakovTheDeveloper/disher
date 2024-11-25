import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { DayService } from './day.service';
import { CreateDayDto } from './dto/create-day.dto';
import { UpdateDayDto } from './dto/update-day.dto';
import { LocalAuthGuard } from 'resources/auth/auth.guard';
import { Request } from 'express';

@Controller('day')
export class DayController {
  constructor(private readonly dayService: DayService) { }

  @UseGuards(LocalAuthGuard)
  @Post()
  async createDay(@Body() createDayDto: CreateDayDto, @Req() request: Request) {
    const userId = request.user?.id
    if (userId == null) {
      throw new BadRequestException('No such user id');
    }
    return this.dayService.createDay(createDayDto.name, createDayDto.categories, userId);
  }

  @UseGuards(LocalAuthGuard)
  @Get()
  findAll(@Req() request: Request) {
    const userId = request.user?.id
    if (userId == null) {
      throw new BadRequestException('No such user id');
    }
    return this.dayService.findAll(userId);
  }

  @UseGuards(LocalAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: Request) {
    // return this.dayService.findOne(+id);
  }

  @UseGuards(LocalAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateDayDto: UpdateDayDto, @Req() request: Request) {
    const userId = request.user?.id
    if (userId == null) {
      throw new BadRequestException('No such user id');
    }
    return this.dayService.update(+id, updateDayDto.name, updateDayDto.categories, userId);
  }

  @UseGuards(LocalAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: Request) {
    const userId = request.user?.id
    if (userId == null) {
      throw new BadRequestException('No such user id');
    }
    return this.dayService.remove(+id, userId);
  }
}
