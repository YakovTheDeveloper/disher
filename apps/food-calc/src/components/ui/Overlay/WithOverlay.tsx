import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import s from './Overlay.module.css';
import { RequestState } from '@/api/RequestState';

type RequestStateMap = Record<string, Map<string, RequestState>>;

type BaseProps = {
  children?: React.ReactNode;
  translucent?: boolean;
};

/** Variant A: controlled by `isLoading` */
type LoadingProps = BaseProps & {
  isLoading: () => boolean;
  requestState?: never;
  requestKey?: never;
  requestId?: never;
};

/** Variant B: controlled by request state map */
type RequestStateProps<T extends RequestStateMap> = BaseProps & {
  isLoading?: never;
  requestState: T;
  requestKey: keyof T;
  requestId: string;
};

/** Combined Props Type */
type Props<T extends RequestStateMap> = LoadingProps | RequestStateProps<T>;

const WithOverlay = <T extends RequestStateMap>(props: Props<T>) => {
  const { children, translucent = true } = props;

  let show = false;

  if ('isLoading' in props && props.isLoading) {
    // Variant A
    show = props.isLoading();
  } else if ('requestState' in props) {
    // Variant B
    const loadingState = props.requestState[props.requestKey].get(props.requestId);
    show = Boolean(loadingState?.loading);
  }

  return (
    <>
      {children}
      <div className={clsx([s.overlay, translucent && s.translucent, show && s.show])}></div>
    </>
  );
};

export default observer(WithOverlay);
