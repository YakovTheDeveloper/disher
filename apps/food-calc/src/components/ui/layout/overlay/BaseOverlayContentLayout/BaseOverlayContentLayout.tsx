import { observer } from 'mobx-react-lite';
import React from 'react';
import styles from './BaseOverlayContentLayout.module.scss';

type Props = {
  header?: React.ReactNode;
  content?: React.ReactNode;
  supFooter?: React.ReactNode;
  footer?: React.ReactNode;
};

const BaseOverlayContentLayout = observer(({ header, content, supFooter, footer }: Props) => {
  return (
    <div className={styles.container}>
      {header && <div className={styles.header}>{header}</div>}
      <div className={styles.content}>{content}</div>
      {supFooter && <div className={styles.supFooter}>{supFooter}</div>}
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
});

export default BaseOverlayContentLayout;
