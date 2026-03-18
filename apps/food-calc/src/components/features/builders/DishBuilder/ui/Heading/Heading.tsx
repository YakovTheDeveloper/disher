import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
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
    console.log('heading e', e.target.value);
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
      <p className={styles.createText}>ваше блюдо </p>
    </div>
  );
};

export default observer(Heading);
