import { Inject, Injectable } from '@nestjs/common'
import { CreateUserNormDto } from './dto/create-user_norm.dto'
import { UpdateUserNormDto } from './dto/update-user_norm.dto'
import { USER_NORMS_REPOSITORY } from 'constants/provide'
import { Repository } from 'typeorm'
import { UserNorm } from 'user_norm/entities/user_norm.entity'
import { User } from 'users/entities/user.entity'

@Injectable()
export class UserNormService {
  constructor(
    @Inject(USER_NORMS_REPOSITORY)
    private repository: Repository<UserNorm>,
  ) { }

  async create(userId: number, createUserNormDto: CreateUserNormDto) {
    const user = new User()
    user.id = userId

    const norms = this.repository.create({ name: createUserNormDto.name, ...createUserNormDto.nutrients })
    norms.user = user
    const { name, id, ...nutrients } = await this.repository.save(norms)
    return { result: { id, name, nutrients } }
  }

  async findAll(id: number) {
    const result = (await this.repository.find({ where: { user: { id } } }))
      .map(({ id, name, ...nutrients }) => ({
        id,
        name,
        nutrients
      }))
    return { result }
  }

  async findOne(id: number) {
    const result = (await this.repository.find({ where: { user: { id } } }))
      .map(({ name, id, ...nutrients }) => ({
        name,
        id,
        nutrients
      }))
    return { result }
  }

  async update(
    normId: number,
    userId: number,
    updateUserNormDto: UpdateUserNormDto,
  ) {
    const user = new User()
    user.id = userId

    const norms = this.repository.create({ name: updateUserNormDto.name, ...updateUserNormDto.nutrients })
    norms.user = user
    norms.id = normId
    norms.name = updateUserNormDto.name

    const { name, id, ...nutrients } = await this.repository.save(norms)
    return { result: { id, nutrients } }
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
