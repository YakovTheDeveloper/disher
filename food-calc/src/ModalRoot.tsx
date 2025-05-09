
import ModalAuth from "@/components/ui/Modal/ModalAuth/ModalAuth";
import ModalDishAdditionals from "@/components/ui/Modal/ModalDishAdditionals/ModalDishAdditionals";
import ModalProduct from "@/components/ui/Modal/ModalProduct/ModalProduct";
import ModalRichNutrientProduct from "@/components/ui/Modal/ModalRichNutrientProduct/ModalRichNutrientProduct";
import RichNutrientProductSkeleton from "@/components/ui/Modal/ModalRichNutrientProduct/RichNutrientProduct/RichNutrientProductSkeleton/RichNutrientProductSkeleton";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import { Typography } from "@/components/ui/Typography/Typography";
import { productStore, rootDayStore2, rootDishStore, uiStore } from "@/store/rootStore";
import { Modals } from "@/store/uiStore/modalStore/modalStore";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";

const ModalRoot = () => {
  const { currentModal, data } = uiStore.modal;

  return (
    <>
      <ModalAuth isOpen={currentModal === Modals.Auth} data={data[Modals.Auth]} />
      <ModalDishAdditionals isOpen={currentModal === Modals.DishAdditionals} rootDishStore={rootDishStore} />
      <ModalProduct
        isOpen={currentModal === Modals.Product}
        data={data[Modals.Product]}
      />
      <ModalRichNutrientProduct
        isOpen={currentModal === Modals.NutrientRichProduct}
        nutrient={data[Modals.NutrientRichProduct]}
        products={productStore.richNutrientProducts}
        getData={productStore.handleGetAllRichNutrientProducts}
        loader={
          <RichNutrientProductSkeleton
            unitName={data[Modals.NutrientRichProduct]?.unitRu}
            nutrientName={data[Modals.NutrientRichProduct]?.name}
            loadingState={productStore.richProductsLoadingState}
          />
        }
        before={
          <Typography variant='caption'>
            добавить продукт в {rootDishStore.currentStore?.name}
          </Typography>
        }
      />
    </>
  );
};

export default observer(ModalRoot);
