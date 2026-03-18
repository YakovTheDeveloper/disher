import { MotionValue } from 'framer-motion';
import EditableText from '@/components/ui/atoms/EditableText/EditableText';
import styles from './HeaderInputName.module.scss';
import { Scalable } from '@/components/ui/Scalable';
import { useScreenScroll } from '@/components/features/builders/shared/ui/layout/Screen/context/ScreenScrollContext';
import { Typography } from '@/components/ui/atoms/Typography';

type Props = {
  entity: {
    name: string;
    changeName: (value: string) => void;
  };
  asInput: boolean;
};

const HeaderInputName = ({ entity, asInput }: Props) => {
  const scrollYProgress = useScreenScroll();

  return (
    <Scalable scrollYProgress={scrollYProgress} className={styles.HeaderInputName}>
      {!asInput ? (
        <Typography>{entity?.name || ''}</Typography>
      ) : (
        <EditableText
          value={entity?.name || ''}
          onChange={(val) => entity?.changeName(val)}
          className={styles.textInput}
        />
      )}
    </Scalable>
  );
};

export default HeaderInputName;
