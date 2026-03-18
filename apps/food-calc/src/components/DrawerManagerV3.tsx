import { useDrawers } from '@/shared/ui/drawer-store';

const DrawerManagerV3 = () => {
  const { instances, close } = useDrawers();

  if (instances.length === 0) return null;

  return (
    <>
      {instances.map(({ id, Component, props }) => (
        <Component key={id} {...props} onClose={(result: any) => close(id, result)} />
      ))}
    </>
  );
};

export default DrawerManagerV3;
