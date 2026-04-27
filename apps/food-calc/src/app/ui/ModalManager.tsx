import { useModals } from "@/shared/ui/modal-store";

export const ModalManager = () => {
  const { instances, close } = useModals();

  if (instances.length === 0) return null;

  return (
    <>
      {instances.map(({ id, Component, props }) => (
        <Component
          key={id}
          {...props}
          onClose={(result: any) => close(id, result)}
        />
      ))}
    </>
  );
};
