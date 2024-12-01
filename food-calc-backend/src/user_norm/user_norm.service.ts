import { Inject, Injectable } from '@nestjs/common';
import { CreateUserNormDto } from './dto/create-user_norm.dto';
import { UpdateUserNormDto } from './dto/update-user_norm.dto';
import { USER_NORMS_REPOSITORY } from 'constants/provide';
import { Repository } from 'typeorm';
import { UserNorm } from 'user_norm/entities/user_norm.entity';
import { User } from 'users/entities/user.entity';

@Injectable()
export class UserNormService {

  constructor(
    @Inject(USER_NORMS_REPOSITORY)
    private repository: Repository<UserNorm>,


  ) { }



  async create(userId: number, createUserNormDto: CreateUserNormDto) {
    const user = new User()
    user.id = userId

    const norms = this.repository.create(createUserNormDto)
    norms.user = user

    return await this.repository.save(norms)
  }

  async findAll(id: number) {
    const result = await this.repository.find({ where: { user: { id } } })
    return { result }
  }

  findOne(id: number) {
    const result = this.repository.find({ where: { user: { id } } })
    return { result }
  }

  async update(id: number, userId: number, updateUserNormDto: UpdateUserNormDto) {
    const user = new User()
    user.id = userId


    const norms = this.repository.create(updateUserNormDto)
    norms.user = user
    norms.id = id

    return await this.repository.save(norms)
  }

  async remove(id: number, userId: number) {
    const norm = new UserNorm()
    const user = new User()
    user.id = userId
    norm.id = id
    norm.user = user
    const result = await this.repository.remove(norm)
    return { result: true }
  }
}
