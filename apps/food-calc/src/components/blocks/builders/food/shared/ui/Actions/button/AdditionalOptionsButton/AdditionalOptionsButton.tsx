import { observer } from 'mobx-react-lite';
import commonStyles from '../styles.module.scss';
import clsx from 'clsx';
type Props = {
  children?: React.ReactNode;
  className?: string;
  options: {
    showAdditionals: boolean;
    toggle: () => void;
  };
};

const AdditionalOptionsButton = ({ options, className }: Props) => {
  const textView = options.showAdditionals ? 'больше' : 'меньше';
  const onClick = options.toggle;
  return (
    <button className={clsx([className, commonStyles.actionButton])} onClick={onClick}>
      {textView}
    </button>
  );
};

export default observer(AdditionalOptionsButton);
