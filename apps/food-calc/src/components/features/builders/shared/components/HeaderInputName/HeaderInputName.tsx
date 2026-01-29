import { observer } from 'mobx-react-lite';
import { MotionValue } from 'framer-motion';
import { Instance } from 'mobx-state-tree';
import { UserFood } from '@/domain/product/Food.model';
import EditableText from '@/components/ui/atoms/EditableText/EditableText';
import styles from './HeaderInputName.module.scss';
import { Scalable } from '@/components/ui/Scalable';
import { useScreenScroll } from '@/components/features/builders/shared/ui/layout/Screen/context/ScreenScrollContext';
type Props = {
  entity: {
    name: string;
    changeName: (value: string) => void;
  };
};

const HeaderInputName = ({ entity }: Props) => {
  const scrollYProgress = useScreenScroll();

  return (
    <Scalable scrollYProgress={scrollYProgress} className={styles.HeaderInputName}>
      <EditableText
        value={entity?.name || ''}
        onChange={(val) => entity?.changeName(val)}
        className={styles.textInput}
      />
    </Scalable>
  );
};

export default observer(HeaderInputName);
