import { useEffect, useRef } from 'react';
import { Heading as HeadingPrimitive } from '@/shared/ui/atoms/Typography';
import styles from './Heading.module.scss';

type Props = {
  store: {
    name: string;
    updateName: (name: string) => void;
  };
};

const Heading = ({ store }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    store.updateName(e.target.value);
  };

  const onBlur = () => {
    if (!store.name) {
      store.updateName('Новое блюдо');
    }
  };

  return (
    <div className={styles.container}>
      <input
        ref={inputRef}
        className={styles.nameText}
        value={store.name}
        onChange={onChange}
        onBlur={onBlur}
      />
      <HeadingPrimitive role="display" as="span" className={styles.createText}>
        ваше блюдо{' '}
      </HeadingPrimitive>
    </div>
  );
};

export default Heading;
