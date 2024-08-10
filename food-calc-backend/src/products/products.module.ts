import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

import { DatabaseModule } from 'database/database.module';
import { productsProvider } from './products.providers';
import { nutrientsProviders } from 'nutrients/nutrients.provider';
import { productsNutrientsProvider } from 'products_nutrients/products_nutrients.providers';
import { NutrientsModule } from 'nutrients/nutrients.module';
import { ProductsNutrientsModule } from 'products_nutrients/products_nutrients.module';
import { ProductsNutrientsService } from 'products_nutrients/products_nutrients.service';

@Module({
  imports: [DatabaseModule, ProductsNutrientsModule, NutrientsModule],
  controllers: [ProductsController],
  providers: [ProductsNutrientsService, ProductsService, ...productsProvider, ...productsNutrientsProvider, ...nutrientsProviders],
})
export class ProductsModule { }
