import { describe, it, beforeEach, expect, vi, onTestFailed, onTestFinished } from 'vitest';
import { ProductStore } from '@/store/productStore/productStore';
import { CalculationStore } from '@/store/calculationStore/calculationStore';
import { NutrientStore } from '@/store/nutrientStore/nutrientStore';

const PRODUCTS = [{ id: 1, quantity: 100 }]
const PRODUCTS_DOUBLED = [{ id: 1, quantity: 200 }]
const PRODUCT_NUTRIENTS_INIT = { 1: 10, 2: 5 }
const PRODUCT_NUTRIENTS_DOUBLED = { 1: 20, 2: 10 }
const PRODUCT_NUTRIENTS_HALVED = { 1: 5, 2: 2.5 }

describe('CalculationStore', () => {

    let calculationStore: CalculationStore;
    let nutrientStore: NutrientStore;
    let productStore: ProductStore

    beforeEach(() => {
        nutrientStore = new NutrientStore()
        productStore = new ProductStore()
        calculationStore = new CalculationStore(nutrientStore, productStore);

        productStore.getProductNutrients = vi.fn().mockReturnValue(PRODUCT_NUTRIENTS_INIT);
    });

    it('should set total nutrients', () => {
        const nutrients = { 1: 100, 2: 200 };
        calculationStore.setTotal(nutrients);
        expect(calculationStore.totalNutrients).toEqual(nutrients);
    });

    it('should calculate nutrients for products', () => {
        const nutrients = calculationStore.calculateNutrients(PRODUCTS);
        expect(nutrients).toEqual({ 1: 10, 2: 5 });
    });

    it('should update total nutrients using products', () => {
        calculationStore.update(PRODUCTS_DOUBLED);
        expect(calculationStore.totalNutrients).toEqual(PRODUCT_NUTRIENTS_DOUBLED);
    });

    it('should calculate nutrients with coefficient', () => {
        const nutrients = calculationStore.calculateNutrients(PRODUCTS, 0.5);
        expect(nutrients).toEqual(PRODUCT_NUTRIENTS_HALVED);
    });

    it('should reset nutrients', () => {
        calculationStore.setTotal({ 1: 100 });
        calculationStore.resetNutrients();

        expect(calculationStore.totalNutrients).toEqual({});
    });

});
