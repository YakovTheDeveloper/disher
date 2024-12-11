import { Module } from '@nestjs/common';
import { NutrientsModule } from 'nutrients/nutrients.module';
import { NutrientsService } from 'nutrients/nutrients.service';
import { ProductsModule } from 'products/products.module';

import { SeedService } from 'seed/seed.service';

@Module({
  imports: [NutrientsModule, ProductsModule],
  providers: [NutrientsService, SeedService],
})
export class SeedModule { }
