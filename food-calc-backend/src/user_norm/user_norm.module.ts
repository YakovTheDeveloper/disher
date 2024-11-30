import { Module } from '@nestjs/common';
import { UserNormService } from './user_norm.service';
import { UserNormController } from './user_norm.controller';
import { DatabaseModule } from 'database/database.module';
import { AuthModule } from 'resources/auth/auth.module';
import { UsersModule } from 'users/users.module';
import { userNormProviders } from 'user_norm/user_norm.provider';

@Module({
  imports: [UsersModule, AuthModule, DatabaseModule],
  controllers: [UserNormController],
  providers: [UserNormService, ...userNormProviders],
})
export class UserNormModule {}
