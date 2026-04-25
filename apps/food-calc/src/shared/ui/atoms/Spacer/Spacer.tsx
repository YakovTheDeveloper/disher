import styles from './Spacer.module.scss';
type Props = {
  variant: 'drawer-footer-offset' | 'screen-header-offset';
};

const Spacer = ({ variant }: Props) => {
  return <div className={styles[variant]} />;
};

export default Spacer;
