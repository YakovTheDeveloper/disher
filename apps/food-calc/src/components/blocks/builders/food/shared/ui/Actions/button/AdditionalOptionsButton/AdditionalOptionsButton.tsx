import { observer } from 'mobx-react-lite';
import styles from './AdditionalOptionsButton.module.scss';
type Props = {
  children: React.ReactNode;
  onClick: VoidFunction;
};

const AdditionalOptionsButton = ({ children, onClick }: Props) => {
  return (
    <button className={styles.container} onClick={onClick}>
      {children}
    </button>
  );
};

export default observer(AdditionalOptionsButton);
