import { observer } from 'mobx-react-lite';
import styles from './Heading.module.scss';

type Props = {
  vm: {
    name: string;
    updateName: (name: string) => void;
  };
};

const Heading = ({ vm }: Props) => {
  const onChange = (e) => {
    vm.updateName(e.target.value);
  };

  const onBlur = () => {
    if (!vm.name) {
      vm.updateName('Новое блюдо');
    }
  };

  return (
    <div className={styles.container}>
      <p className={styles.createText}>ваше блюдо</p>
      {/* <p className={styles.nameText}>{children}</p> */}
      <input className={styles.nameText} value={vm.name} onChange={onChange} onBlur={onBlur} />
    </div>
  );
};

export default observer(Heading);
