import { observer } from 'mobx-react-lite';
import { drawerStore } from '@/shared/ui/drawer-store';

const DrawerManagerV3 = observer(() => {
  if (drawerStore.instances.length === 0) return null;

  return (
    <>
      {drawerStore.instances.map(({ id, Component, props }) => (
        <Component key={id} {...props} onClose={(result: any) => drawerStore.close(id, result)} />
      ))}
    </>
  );
});

export default DrawerManagerV3;
