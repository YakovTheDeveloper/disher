import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { USER_REPOSITORY } from 'constants/provide';

@Injectable()
export class UsersService {

  constructor(
    @Inject(USER_REPOSITORY)
    private usersRepository: Repository<User>,
  ) { }

  create(createUserDto: Pick<CreateUserDto, 'login' | 'password'>) {
    return this.usersRepository.save(createUserDto)
  }

  findAll() {
    return this.usersRepository.find();
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOneBy({
      id
    })
    return user
  }

  async findByLogin(login: string) {
    const user = await this.usersRepository.findOneBy({
      login
    })
    return user
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }


}
