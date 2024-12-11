import DishItem from "@/components/blocks/Dish/DishItem/DishProduct";
import NutrientPercent from "@/components/blocks/NutrientsTotal/NutrientPercent/NutrientPercent";
import NutrientsList from "@/components/blocks/NutrientsTotal/NutrientsList/NutrientsList";
import NutrientsTotal from "@/components/blocks/NutrientsTotal/NutrientsTotal";
import NutrientValue from "@/components/blocks/NutrientsTotal/NutrientValue/NutrientValue";
import Modal from "@/components/ui/Modal/Modal";
import { Typography } from "@/components/ui/Typography/Typography";
import { CalculationStore } from "@/store/calculationStore/calculationStore";
import { IProductBase } from "@/types/dish/dish";
import { makeAutoObservable, reaction, toJS } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import s from './ModalProduct.module.css'
import { rootDailyNormStore } from "@/store/rootStore";

type Props = {
    data: IProductBase | null;
    isOpen: boolean;
};

class Product {
    data: IProductBase | null = null;
    calculations = new CalculationStore();

    constructor() {
        makeAutoObservable(this);

        reaction(
            () => [toJS(this.data)],
            ([data]) => {
                console.log("quantity", data?.quantity);
                if (!data) return;
                this.calculations.update([
                    {
                        id: data.id,
                        quantity: data.quantity,
                    },
                ]);
            }
        );
    }

    setQuantity = (value: number) => {
        if (!this.data) return;
        this.data.quantity = value;
    };

    setProduct = (product: IProductBase | null) => {
        if (!product) {
            this.data = product;
            return;
        }
        const { id, name } = product;
        this.data = {
            id,
            name,
            quantity: 100,
        };
    };
}

const ModalProduct = ({ isOpen, data }: Props) => {
    const product = React.useMemo(() => new Product(), []);

    // Sync product state with incoming `data` prop
    useEffect(() => {
        product.setProduct(data);
    }, [data, product]);

    const setProductQuantity = (_: number, value: number) => {
        product.setQuantity(value);
    };

    return (
        <Modal isOpen={isOpen}>
            <header className={s.header}>
                {/* <Typography variant="h2">{product.data?.name}</Typography> */}
                {product.data && (
                    <DishItem
                        product={product.data}
                        setProductQuantity={setProductQuantity}
                    />
                )}
            </header>
            <NutrientsTotal>
                <NutrientsList
                    wrap
                    rowPositionSecond={(nutrient) => (
                        <NutrientValue calculations={product.calculations} nutrient={nutrient} />
                    )}
                    rowPositionThird={(nutrient) => (
                        <NutrientPercent
                            dailyNutrientNorm={rootDailyNormStore.currentDailyNormUsedInCalculations}
                            nutrient={nutrient}
                            nutrientQuantity={
                                product.calculations.totalNutrients[nutrient.id]
                            }
                        />
                    )}
                >
                </NutrientsList>
            </NutrientsTotal>
        </Modal>
    );
};

export default observer(ModalProduct);
