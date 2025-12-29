import { observer } from 'mobx-react-lite';
import styles from './ContentContainer.module.scss';
import clsx from 'clsx';
type Props = {
  children: React.ReactNode;
  className?: string;
};

const ContentContainer = ({ children, className }: Props) => {
  return <div className={clsx([styles.container, className])}>ContentContainer</div>;
};

export default observer(ContentContainer);
