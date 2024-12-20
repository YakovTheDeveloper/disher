import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs'

import { Repository } from 'typeorm';
import { Nutrient } from 'nutrients/entities/nutrient.entity';
import { defaultNutrients } from './data';
import { NUTRIENTS_REPOSITORY, PRODUCTS_REPOSITORY } from 'constants/provide';
import { Product } from 'products/entities/product.entity';
import { ProductsNutrient } from 'products_nutrients/entities/products_nutrient.entity';

type ParsedProduct = {
    id: number
    name: string,
    nameRu: string,
    nutrients: { id: number, name: string, value: number, unitName: string }[]
}

@Injectable()
export class SeedService implements OnModuleInit {

    constructor(
        @Inject(NUTRIENTS_REPOSITORY)
        private nutrientsRepository: Repository<Nutrient>,
        @Inject(PRODUCTS_REPOSITORY)
        private productsRepository: Repository<Product>,
    ) { }

    async onModuleInit() {
        // await this.insertDefaultNutrients();
    }

    private async insertDefaultNutrients() {
        const existingNutrients = await this.nutrientsRepository.find({ where: defaultNutrients.map(n => ({ name: n.name })) });
        const existingNames = existingNutrients.map(n => n.name);

        const newNutrients = defaultNutrients.filter(n => !existingNames.includes(n.name));

        if (newNutrients.length > 0) {
            await this.nutrientsRepository.insert(newNutrients);
        }


        // Load the JSON file
        fs.readFile('src/seed/init_products.json', 'utf-8', async (err, data) => {
            if (err) {
                console.error("Error reading file:", err);
                return;
            }

            try {
                const jsonData = JSON.parse(data) as ParsedProduct[];

                const products: Product[] = []

                jsonData.forEach(async product => {

                    // const exist = await this.productsRepository.find({ where: { id: product.id } })
                    // if (exist) return

                    const newProduct = new Product()
                    newProduct.description = product.name
                    newProduct.name = product.name
                    newProduct.id = product.id
                    newProduct.nameRu = product.nameRu
                    const productNutrients: ProductsNutrient[] = []

                    product.nutrients.forEach(({ id, name, unitName, value }) => {
                        const productNutrient = new ProductsNutrient()
                        const nutrient = new Nutrient()
                        nutrient.id = id
                        productNutrient.nutrient = nutrient
                        productNutrient.product = newProduct
                        productNutrient.quantity = value
                        productNutrients.push(productNutrient)
                    })
                    newProduct.productNutrients = productNutrients
                    products.push(newProduct)
                })
                console.log(products)
                if (products.length > 0) {
                    this.productsRepository.save(products);
                }

            } catch (parseError) {
                console.error("Error parsing JSON:", parseError);
            }
        });





    }
}