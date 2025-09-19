import { observer } from 'mobx-react-lite';
import commonStyles from '../styles.module.scss';
type Props = {
  children?: React.ReactNode;
  onClick: VoidFunction;
  options: {
    showAdditionals: boolean;
  };
};

const AdditionalOptionsButton = ({ options, onClick }: Props) => {
  const textView = options.showAdditionals ? 'больше' : 'меньше';
  return (
    <button className={commonStyles.actionButton} onClick={onClick}>
      {textView}
    </button>
  );
};

export default observer(AdditionalOptionsButton);
