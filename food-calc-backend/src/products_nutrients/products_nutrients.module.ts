import { Module } from '@nestjs/common';
import { ProductsNutrientsService } from './products_nutrients.service';
import { ProductsNutrientsController } from './products_nutrients.controller';
import { DatabaseModule } from 'database/database.module';
import { productsNutrientsProvider } from './products_nutrients.providers';
import { NutrientsModule } from 'nutrients/nutrients.module';
import { nutrientsProviders } from 'nutrients/nutrients.provider';

@Module({
  imports: [DatabaseModule, NutrientsModule, ProductsNutrientsModule],
  controllers: [ProductsNutrientsController],
  providers: [ProductsNutrientsService, ...productsNutrientsProvider, ...nutrientsProviders],
})
export class ProductsNutrientsModule { }
