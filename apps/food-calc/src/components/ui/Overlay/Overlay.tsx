import React from 'react';
import s from './Overlay.module.css';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
type Props = {
  children?: React.ReactNode;
  isLoading: () => boolean;
  translucent?: boolean;
};
const Overlay = ({ isLoading, translucent = true }: Props) => {
  const show = isLoading();
  console.log(show);
  return <div className={clsx([s.overlay, translucent && s.translucent, show && s.show])}></div>;
};

export default observer(Overlay);
