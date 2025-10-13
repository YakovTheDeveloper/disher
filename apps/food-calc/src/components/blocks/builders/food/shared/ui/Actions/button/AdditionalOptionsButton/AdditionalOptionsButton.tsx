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
  isShow?: () => boolean;
};

const AdditionalOptionsButton = ({ options, className, isShow }: Props) => {
  const textView = options.showAdditionals ? 'больше' : 'меньше';
  const onClick = options.toggle;

  if (!isShow?.()) return null;
  return (
    <button className={clsx([className, commonStyles.actionButton])} onClick={onClick}>
      {textView}
    </button>
  );
};

export default observer(AdditionalOptionsButton);
