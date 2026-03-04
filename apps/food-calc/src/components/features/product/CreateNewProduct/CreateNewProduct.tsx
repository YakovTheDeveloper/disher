import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { productFactory } from "@/domain/product/Food.factory";
import { domainStore } from "@/store/store";
import toaster from "@/infrastructure/toaster/toaster";
import styles from './CreateNewProduct.module.scss'

type Props = {
  name: string;
}

const CreateNewProduct = ({ name }: Props) => {
  useEffect(() => {
    if (!name) return;

    const food = productFactory.createNewLocal({
      name: name,
      description: '',
      createdByUser: true,
    });

    domainStore.foodStore.user.insert(food);
    toaster.success('Продукт создан');
  }, [name]);

  return null;
}

export default observer(CreateNewProduct);
