import { observer } from "mobx-react-lite";
import { modalStoreV2 } from "@/store/GlobalUiStore/ModalStoreV2/ModalStoreV2";

export const ModalManagerV2 = observer(() => {
  if (modalStoreV2.instances.length === 0) return null;

  return (
    <>
      {modalStoreV2.instances.map(({ id, Component, props }) => (
        <Component
          key={id}
          {...props}
          onClose={(result: any) => modalStoreV2.close(id, result)}
        />
      ))}
    </>
  );
});
