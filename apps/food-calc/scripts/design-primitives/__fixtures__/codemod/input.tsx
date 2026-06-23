import { memo } from 'react';
import styles from './Widget.module.scss';

type Props = { title: string; detail: string };

const Widget = ({ title, detail }: Props) => (
  <article className={styles.card}>
    <h3 className={styles.title}>{title}</h3>
    <p className={styles.detail}>{detail}</p>
  </article>
);

export default memo(Widget);
