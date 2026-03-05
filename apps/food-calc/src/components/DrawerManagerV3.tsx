import { observer } from 'mobx-react-lite';
import { drawerStoreV3 } from '@/store/GlobalUiStore/DrawerStoreV3/DrawerStoreV3';

const DrawerManagerV3 = observer(() => {
  if (drawerStoreV3.instances.length === 0) return null;

  return (
    <>
      {drawerStoreV3.instances.map(({ id, Component, props }) => (
        <Component key={id} {...props} onClose={(result: any) => drawerStoreV3.close(id, result)} />
      ))}
    </>
  );
});

export default DrawerManagerV3;
