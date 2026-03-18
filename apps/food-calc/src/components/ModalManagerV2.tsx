import { observer } from "mobx-react-lite";
import { modalStore } from "@/shared/ui/modal-store";

export const ModalManagerV2 = observer(() => {
  if (modalStore.instances.length === 0) return null;

  return (
    <>
      {modalStore.instances.map(({ id, Component, props }) => (
        <Component
          key={id}
          {...props}
          onClose={(result: any) => modalStore.close(id, result)}
        />
      ))}
    </>
  );
});
