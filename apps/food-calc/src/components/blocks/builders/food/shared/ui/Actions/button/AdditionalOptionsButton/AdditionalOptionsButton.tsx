import { observer } from 'mobx-react-lite';
import commonStyles from '../styles.module.scss';
type Props = {
  children?: React.ReactNode;
  options: {
    showAdditionals: boolean;
    toggle: () => void;
  };
};

const AdditionalOptionsButton = ({ options }: Props) => {
  const textView = options.showAdditionals ? 'больше' : 'меньше';
  const onClick = options.toggle;
  return (
    <button className={commonStyles.actionButton} onClick={onClick}>
      {textView}
    </button>
  );
};

export default observer(AdditionalOptionsButton);
