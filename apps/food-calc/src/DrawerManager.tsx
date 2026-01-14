import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { scheduleDrawers } from '@/components/features/builders/food/ScheduleBuilder/components/drawer/ScheduleDrawers';
import { DrawerDefinition } from '@/types/common/drawer';
import { domainStore } from '@/store/store';

export function createDrawerRegistry(definitions: DrawerDefinition[]) {
  const map = new Map<string, DrawerDefinition>();

  for (const def of definitions) {
    if (map.has(def.type)) {
      throw new Error(`Duplicate drawer type: ${def.type}`);
    }
    map.set(def.type, def);
  }

  return map;
}

export const drawerRegistry = createDrawerRegistry([...scheduleDrawers]);

export const DrawerManager = observer(() => {
  const { drawerStore } = domainStore.globalUiStore;
  const { activeDrawer, isOpen, close, syncFromUrl } = drawerStore;

  useEffect(() => {
    syncFromUrl();

    const handlePopState = () => {
      syncFromUrl();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [syncFromUrl]);

  if (!isOpen || !activeDrawer) return null;

  const definition = drawerRegistry.get(activeDrawer.type);

  if (!definition) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Unknown drawer:', activeDrawer.type);
    }
    return null;
  }

  return (
    <>
      {definition.render({
        // @ts-expect-error - activeDrawer matches DrawerPayloadModel which might or might not have payload
        payload: activeDrawer.payload,
        close: () => close(),
      })}
    </>
  );
});
