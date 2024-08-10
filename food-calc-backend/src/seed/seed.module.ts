import { Module } from '@nestjs/common';
import { NutrientsService } from 'nutrients/nutrients.service';

import { SeedService } from 'seed/seed.service';

@Module({
  providers: [NutrientsService, SeedService],
})
export class SeedModule { }
