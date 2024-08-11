import { Module } from '@nestjs/common';
import { MenuProductService } from './menu_product.service';
import { MenuProductController } from './menu_product.controller';
import { menuProductProviders } from './menu_product.providers';
import { DatabaseModule } from 'database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MenuProductController],
  providers: [MenuProductService, ...menuProductProviders],
})
export class MenuProductModule { }
