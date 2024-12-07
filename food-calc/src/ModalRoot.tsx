import ModalAuth from "@/components/ui/Modal/ModalAuth";
import ModalProduct from "@/components/ui/Modal/ModalProduct";
import { uiStore } from "@/store/rootStore";
import { Modals } from "@/store/uiStore/uiStore";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";

const ModalRoot = () => {
  const { currentModal, data } = uiStore;

  console.log("datadata", toJS(data[Modals.Product]));

  return (
    <>
      <ModalAuth isOpen={currentModal === Modals.Auth} />
      <ModalProduct
        isOpen={currentModal === Modals.Product}
        data={data[Modals.Product]}
      />
    </>
  );
};

export default observer(ModalRoot);
