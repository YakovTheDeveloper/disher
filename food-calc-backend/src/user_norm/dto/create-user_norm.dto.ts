import { IsNumber, IsOptional } from 'class-validator';

export class CreateUserNormDto {
    name: string; // Name of the user norm

    nutrients: NutrientsDto
}

class NutrientsDto {
    @IsNumber()
    protein: number; // Protein (g)

    @IsNumber()
    fats: number; // Fats (g)

    @IsNumber()
    carbohydrates: number; // Carbohydrates (g)

    @IsNumber()
    fiber: number; // Fiber (g)

    @IsNumber()
    energy: number; // Energy (kcal)

    @IsNumber()
    water: number; // Water (g)

    @IsNumber()
    iron: number; // Iron (mg)

    @IsNumber()
    magnesium: number; // Magnesium (mg)

    @IsNumber()
    phosphorus: number; // Phosphorus (mg)

    @IsNumber()
    potassium: number; // Potassium (mg)

    @IsNumber()
    sodium: number; // Sodium (mg)

    @IsNumber()
    zinc: number; // Zinc (mg)

    @IsNumber()
    copper: number; // Copper (μg)

    @IsNumber()
    manganese: number; // Manganese (μg)

    @IsNumber()
    selenium: number; // Selenium (μg)

    @IsNumber()
    iodine: number; // Iodine (μg)

    @IsNumber()
    vitaminA: number; // Vitamin A (μg)

    @IsNumber()
    vitaminB1: number; // Vitamin B1 (mg)

    @IsNumber()
    vitaminB2: number; // Vitamin B2 (mg)

    @IsNumber()
    vitaminB3: number; // Vitamin B3 (mg)

    @IsNumber()
    vitaminB4: number; // Vitamin B4 (mg)

    @IsNumber()
    vitaminB5: number; // Vitamin B5 (mg)

    @IsNumber()
    vitaminB6: number; // Vitamin B6 (mg)

    @IsNumber()
    vitaminB9: number; // Vitamin B9 (μg)

    @IsNumber()
    vitaminB12: number; // Vitamin B12 (μg)

    @IsNumber()
    vitaminC: number; // Vitamin C (mg)

    @IsNumber()
    vitaminD: number; // Vitamin D (μg)

    @IsNumber()
    vitaminE: number; // Vitamin E (mg)

    @IsNumber()
    vitaminK: number; // Vitamin K (μg)

    @IsNumber()
    betaCarotene: number; // Beta-carotene (μg)

    @IsNumber()
    alphaCarotene: number; // Alpha-carotene (μg)
}