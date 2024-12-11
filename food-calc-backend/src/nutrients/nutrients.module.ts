import { Module } from '@nestjs/common';
import { NutrientsService } from './nutrients.service';
import { NutrientsController } from './nutrients.controller';
import { nutrientsProviders } from './nutrients.provider';
import { DatabaseModule } from 'database/database.module';
import { SeedService } from 'seed/seed.service';
import { SeedModule } from 'seed/seed.module';

@Module({
  imports: [DatabaseModule],
  controllers: [NutrientsController],
  providers: [NutrientsService, ...nutrientsProviders],
  exports: [...nutrientsProviders]
})
export class NutrientsModule { }
