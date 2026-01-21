import React, { useState } from 'react';
import { Drawer } from 'vaul';

import styles from './TestModalPage.module.scss';

const TestModalPage: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className={styles.container}>
      <button onClick={() => setDrawerOpen(true)} className={styles.openButton}>
        Open Drawer
      </button>

      <Drawer.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className={styles.drawerOverlay} />
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
};

export default TestModalPage;
