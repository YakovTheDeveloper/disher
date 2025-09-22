import { observer } from 'mobx-react-lite';
import { MenuUiStore } from '@/store/uiStore/menu/menuUiStore';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Menu.module.scss';
import { NavLink } from 'react-router';
import { RouterLinks } from '@/router';

type Props = {
  children?: React.ReactNode;
  store: MenuUiStore;
};

const Menu = ({ store, children }: Props) => {
  const show = store.isOpen;

  const onClose = () => store.close();

  return (
    <AnimatePresence>
      {show && (
        <motion.aside
          className={styles.container}
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <button className={styles.closeBtn} onClick={onClose}>
            x
          </button>
          {/* <div className={styles.links}>
            <NavLink className={styles.link} to={RouterLinks.Schedule}>
              Календарь
            </NavLink>
            <NavLink className={styles.link} to={''}>
              Мои блюда
            </NavLink>
          </div> */}
          <div>{children}</div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default observer(Menu);
