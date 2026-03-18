import { useEffect } from "react";
import { createProduct } from "@/entities/product";
import toaster from "@/infrastructure/toaster/toaster";

type Props = {
  name: string;
}

const CreateNewProduct = ({ name }: Props) => {
  useEffect(() => {
    if (!name) return;

    createProduct({
      name: name,
      description: '',
    });

    toaster.success('Продукт создан');
  }, [name]);

  return null;
}

export default CreateNewProduct;
