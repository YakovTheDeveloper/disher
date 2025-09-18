import { observer } from 'mobx-react-lite';
import styles from './Pages.module.scss';
type Props = {
  children: React.ReactNode[];
};

const Pages = ({ children }: Props) => {
  console.log('wtf');

  return (
    <>
      {children.map((child, i) => (
        <div key={i} className={styles.page} style={{ flex: `0 0 ${100 / children.length}%` }}>
          {child}
          <div className={styles.offset}></div>
        </div>
      ))}
    </>
  );
};

export default observer(Pages);
