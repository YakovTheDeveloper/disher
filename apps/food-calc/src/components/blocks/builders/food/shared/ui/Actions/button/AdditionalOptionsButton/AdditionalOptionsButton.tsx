import { observer } from 'mobx-react-lite';
import commonStyles from '../styles.module.scss';
import styles from './AdditionalOptionsButton.module.scss';
import clsx from 'clsx';
type Props = {
  children?: React.ReactNode;
  className?: string;
  options: {
    showAdditionals: boolean;
  };
  onClick: () => void;
  isShow?: () => boolean;
};

const AdditionalOptionsButton = ({ options, className, isShow, onClick }: Props) => {
  const textView = options.showAdditionals ? 'меньше опций' : 'больше опций';

  if (!isShow?.()) return null;
  return (
    <button
      className={clsx([
        styles.button,
        className,
        commonStyles.actionButton,
        options.showAdditionals && styles.active,
      ])}
      onClick={onClick}
    >
      {textView}
    </button>
  );
};

export default observer(AdditionalOptionsButton);
