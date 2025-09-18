import React from 'react';
import s from './Overlay.module.css';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
type Props = {
  children?: React.ReactNode;
  isLoading: () => boolean;
  translucent?: boolean;
};
const WithOverlay = ({ children, isLoading, translucent = true }: Props) => {
  const show = isLoading();
  return (
    <div className={clsx([s.container])}>
      {children}
      <div className={clsx([s.overlay, translucent && s.translucent, show && s.show])}></div>
    </div>
  );
};

export default observer(WithOverlay);
