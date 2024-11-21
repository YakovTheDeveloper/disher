import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { DayService } from './day.service';
import { CreateDayDto } from './dto/create-day.dto';
import { UpdateDayDto } from './dto/update-day.dto';
import { LocalAuthGuard } from 'resources/auth/auth.guard';

@Controller('day')
export class DayController {
  constructor(private readonly dayService: DayService) { }

  @UseGuards(LocalAuthGuard)
  @Post()
  async createDay(@Body() createDayDto: CreateDayDto) {
    return this.dayService.createDay(createDayDto.dayName, createDayDto.dayContent);
  }

  @UseGuards(LocalAuthGuard)
  @Get()
  findAll() {
    return this.dayService.findAll();
  }

  @UseGuards(LocalAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    // return this.dayService.findOne(+id);
  }

  @UseGuards(LocalAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateDayDto: UpdateDayDto) {
    return this.dayService.update(+id, updateDayDto.dayName, updateDayDto.dayContent);
  }
  
  @UseGuards(LocalAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    // return this.dayService.remove(+id);
  }
}
