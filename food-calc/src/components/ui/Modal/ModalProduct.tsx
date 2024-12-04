import DishItem from "@/components/blocks/Dish/DishItem/DishItem";
import NutrientPercent from "@/components/blocks/NutrientsTotal/NutrientPercent/NutrientPercent";
import NutrientsTotal from "@/components/blocks/NutrientsTotal/NutrientsTotal";
import Modal from "@/components/ui/Modal/Modal";
import { Typography } from "@/components/ui/Typography/Typography";
import { CalculationStore } from "@/store/calculationStore/calculationStore";
import { IProductBase } from "@/types/dish/dish";
import { makeAutoObservable, reaction, toJS } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";

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

    const setProductQuantity = (_: string, value: number) => {
        product.setQuantity(value);
    };

    return (
        <Modal isOpen={isOpen}>
            {product.data && (
                <DishItem
                    product={product.data}
                    setProductQuantity={setProductQuantity}
                />
            )}
            <NutrientsTotal
                rowPositionSecond={({ id }) => (
                    <Typography>
                        {product.calculations.totalNutrients[id]}
                    </Typography>
                )}
                rowPositionThird={({ id }) => (
                    <NutrientPercent
                        nutrientId={id}
                        nutrientQuantity={
                            product.calculations.totalNutrients[id]
                        }
                    />
                )}
            />
        </Modal>
    );
};

export default observer(ModalProduct);
