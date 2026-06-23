import { memo } from 'react';
import styles from './Widget.module.scss';
import { Heading, Text } from '@/shared/ui/atoms/Typography';

type Props = { title: string; detail: string };

const Widget = ({ title, detail }: Props) => (
  <article className={styles.card}>
    <Heading as="h3" size="card" className={styles.title}>{title}</Heading>
    <Text role="body" className={styles.detail}>{detail}</Text>
  </article>
);

export default memo(Widget);
