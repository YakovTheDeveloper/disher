import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { Request } from 'express';

import { CreateDishDto } from 'foodCollection/common/dto/create-foodCollection.dto';
import { UpdateFoodCollectionDto } from 'foodCollection/common/dto/update-foodCollection.dto';
import { FoodCollectionService } from 'foodCollection/common/foodCollection.service';
import { LocalAuthGuard } from 'resources/auth/auth.guard';



export class FoodCollectionController {
    constructor(private readonly service: FoodCollectionService) { }

    @UseGuards(LocalAuthGuard)
    @Post()
    async create(@Body() createDto: CreateDishDto, @Req() request: Request) {
        const userId = request.user?.id
        if (userId == null) {
            throw new BadRequestException('No such user id');
        }
        const menu = await this.service.create(createDto, userId);
        return menu
    }

    @UseGuards(LocalAuthGuard)
    @Get()
    findAll(@Req() request: Request) {
        const userId = request.user?.id
        if (userId == null) {
            throw new BadRequestException('No such user id');
        }
        return this.service.findAll(userId);
    }

    @UseGuards(LocalAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string, @Req() request: Request) {
        const userId = request.user?.id
        if (userId == null) {
            throw new BadRequestException('No such user id');
        }
        return this.service.findOne(+id, userId);
    }
    
    @UseGuards(LocalAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: UpdateFoodCollectionDto) {
        return this.service.update(+id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(+id);
    }
}
