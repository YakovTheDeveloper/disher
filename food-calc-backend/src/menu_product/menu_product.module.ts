import { Module } from '@nestjs/common';
import { MenuProductService } from './menu_product.service';
import { MenuProductController } from './menu_product.controller';

@Module({
  controllers: [MenuProductController],
  providers: [MenuProductService],
})
export class MenuProductModule {}
