import styles from './DrawerLayout.module.scss';
import clsx from 'clsx';
import { Drawer } from '@base-ui/react/drawer';
import { useTranslation } from 'react-i18next';
import CrossIcon from '@/shared/assets/icons/cross.svg';

type Props = {
  children: React.ReactNode;
  topRight?: React.ReactNode;
  className?: string;
  a11yLabel?: string;
};

const DrawerLayout = ({ children, topRight, className, a11yLabel }: Props) => {
  const { t } = useTranslation();

  return (
    <Drawer.Popup className={clsx(styles.content, className)} id="drawer-content">
      <Drawer.Title className={styles.srOnly}>
        {a11yLabel ?? t('overlay.drawer.defaultA11yLabel', 'Панель')}
      </Drawer.Title>
      <div className={styles.dragHandle}>
        <Drawer.Close
          className={clsx(styles.topLeft, styles.actionHeaderButton, styles.actionHeaderButton_back)}
          onClick={(e) => e.stopPropagation()}
        >
          <CrossIcon />
        </Drawer.Close>
        <div className={clsx(styles.actionHeaderButton, styles.topRight)}>{topRight}</div>
      </div>
      <Drawer.Content id="drawer-content-scrollable" className={styles.scrollableContent}>
        {children}
      </Drawer.Content>
    </Drawer.Popup>
  );
};

export default DrawerLayout;
