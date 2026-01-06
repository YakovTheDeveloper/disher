import { observer } from 'mobx-react-lite';
import styles from './NextButton.module.scss';
type Props = {
  children?: React.ReactNode;
  onClick: () => void;
};

const NextButton = ({ children, onClick }: Props) => {
  return (
    <div className={styles.container} onClick={onClick}>
      {'->'}
    </div>
  );
};

export default observer(NextButton);
