import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { Request } from 'express';

import { CreateFoodCollectionDto } from 'foodCollection/common/dto/create-foodCollection.dto';
import { UpdateFoodCollectionDto } from 'foodCollection/common/dto/update-foodCollection.dto';
import { FoodCollectionService } from 'foodCollection/common/foodCollection.service';
import { LocalAuthGuard } from 'resources/auth/auth.guard';



export class FoodCollectionController {
    constructor(private readonly service: FoodCollectionService) { }

    @UseGuards(LocalAuthGuard)
    @Post()
    async create(@Body() createDto: CreateFoodCollectionDto, @Req() request: Request) {
        const userId = request.user?.id
        if (userId == null) {
            throw new BadRequestException('No such user id');
        }
        const menu = await this.service.create(createDto, userId);
        return menu
    }

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: UpdateFoodCollectionDto) {
        return this.service.update(+id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(+id);
    }
}
