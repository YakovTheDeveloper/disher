import { describe, it, beforeEach, expect, vi, onTestFailed, onTestFinished } from 'vitest';
import { ProductStore } from '@/store/productStore/productStore';
import { CalculationStore } from '@/store/calculationStore/calculationStore';
import { NutrientStore } from '@/store/nutrientStore/nutrientStore';
import { DayCategoryStore } from '@/store/rootDayStore/dayCategoryStore/dayCategoryStore';
import { DayStore2, UserDayStore2 } from '@/store/rootDayStore/dayStore2';
import { MockDay, PRODUCT_NUTRIENTS_INIT_DAY } from '@/store/calculationStore/mock';

const PRODUCTS = [{ id: 1, quantity: 100 }]
const PRODUCTS_DOUBLED = [{ id: 1, quantity: 200 }]
const PRODUCT_NUTRIENTS_INIT = { 1: 10, 2: 5 }
const PRODUCT_NUTRIENTS_DOUBLED = { 1: 20, 2: 60 }
const PRODUCT_NUTRIENTS_HALVED = { 1: 5, 2: 15 }
const PRODUCT_NUTRIENTS_RESULT_DAY = {
    1: 29,
    2: 30.1,
    3: 5.1,
    4: 250,
}

describe('CalculationStore', () => {

    let calculationStore: CalculationStore;
    let nutrientStore: NutrientStore;
    let productStore: ProductStore
    let day: UserDayStore2

    beforeEach(() => {
        nutrientStore = new NutrientStore()
        productStore = new ProductStore()
        calculationStore = new CalculationStore(nutrientStore, productStore);
        productStore.setProductNutrientData(PRODUCT_NUTRIENTS_INIT_DAY)
        day = new UserDayStore2(MockDay)
        // productStore.getProductNutrients = vi.fn().mockReturnValue(PRODUCT_NUTRIENTS_INIT);
    });

    it('should set total nutrients', () => {
        const nutrients = { 1: 100, 2: 200 };
        calculationStore.setTotal(nutrients);
        expect(calculationStore.totalNutrients).toEqual(nutrients);
    });

    it('should calculate nutrients for products', () => {
        const nutrients = calculationStore.calculateNutrients(PRODUCTS);
        expect(nutrients).toEqual({ 1: 10, 2: 30 });
    });

    it('should update total nutrients using products', () => {
        calculationStore.update(PRODUCTS_DOUBLED);
        expect(calculationStore.totalNutrients).toEqual(PRODUCT_NUTRIENTS_DOUBLED);
    });

    it('should calculate nutrients with quantity', () => {
        const nutrients = calculationStore.calculateNutrients(PRODUCTS, 50);
        expect(nutrients).toEqual(PRODUCT_NUTRIENTS_HALVED);
    });

    it('should reset nutrients', () => {
        calculationStore.setTotal({ 1: 100 });
        calculationStore.resetNutrients();

        expect(calculationStore.totalNutrients).toEqual({});
    });

    it('should be correct calcualted result for day (as sum of day categories)', () => {
        const nutrients = calculationStore.getCalculatedDay(day.categories);

        expect(nutrients).toEqual(PRODUCT_NUTRIENTS_RESULT_DAY);
    });
});
