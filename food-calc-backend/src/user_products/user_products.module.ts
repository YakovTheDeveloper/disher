import { Module } from '@nestjs/common';
import { UserProductsService } from './user_products.service';
import { UserProductsController } from './user_products.controller';

@Module({
  controllers: [UserProductsController],
  providers: [UserProductsService],
})
export class UserProductsModule {}
