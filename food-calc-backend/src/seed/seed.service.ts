import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import { Repository } from 'typeorm';
import { Nutrient } from 'nutrients/entities/nutrient.entity';
import { defaultNutrients } from './data';

@Injectable()
export class SeedService implements OnModuleInit {

    constructor(
        @Inject('NUTRIENTS_REPOSITORY')
        private nutrientsRepository: Repository<Nutrient>,
    ) { }

    async onModuleInit() {
        await this.insertDefaultNutrients();
    }

    private async insertDefaultNutrients() {
        const existingNutrients = await this.nutrientsRepository.find({ where: defaultNutrients.map(n => ({ name: n.name })) });
        const existingNames = existingNutrients.map(n => n.name);

        const newNutrients = defaultNutrients.filter(n => !existingNames.includes(n.name));

        if (newNutrients.length > 0) {
            await this.nutrientsRepository.insert(newNutrients);
        }
    }
}