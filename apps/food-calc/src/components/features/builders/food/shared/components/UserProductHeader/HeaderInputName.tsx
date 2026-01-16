import { observer } from 'mobx-react-lite';
import { MotionValue } from 'framer-motion';
import { Instance } from 'mobx-state-tree';
import { UserFood } from '@/domain/Food';
import EditableText from '@/components/ui/EditableText/EditableText';
import styles from './HeaderInputName.module.scss';
import { Scalable } from '@/components/ui/Scalable';
type Props = {
  scrollYProgress: MotionValue<number>;
  entity: {
    name: string;
    changeName: (value: string) => void;
  };
};

const HeaderInputName = ({ entity, scrollYProgress }: Props) => {
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
