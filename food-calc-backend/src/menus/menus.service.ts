import { Inject, Injectable } from '@nestjs/common';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MENUS_REPOSITORY } from 'constants/provide';
import { Repository } from 'typeorm';
import { Menu } from './entities/menu.entity';
import { UsersModule } from 'users/users.module';
import { UsersService } from 'users/users.service';

@Injectable()
export class MenusService {

  constructor(
    @Inject(MENUS_REPOSITORY)
    private menusRepository: Repository<Menu>,
    @Inject(UsersService)
    private usersService: UsersService,
  ) { }

  async create(createMenuDto: CreateMenuDto) {
    const user = await this.usersService.findOne(createMenuDto.user.id)

    const menu = await this.menusRepository.save(createMenuDto)
    return menu
  }

  findAll() {
    return `This action returns all menus`;
  }

  findOne(id: number) {
    return `This action returns a #${id} menu`;
  }

  update(id: number, updateMenuDto: UpdateMenuDto) {
    return `This action updates a #${id} menu`;
  }

  remove(id: number) {
    return `This action removes a #${id} menu`;
  }
}
