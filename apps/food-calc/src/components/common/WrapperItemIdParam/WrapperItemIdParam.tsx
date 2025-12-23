import React from 'react';
import { observer } from 'mobx-react-lite';
import { useSearchParams } from 'react-router-dom';

type Props = {
  children: React.ReactElement;
};

const WrapperItemIdParam = ({ children }: Props) => {
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get('item_id');

  if (!itemId) return null;

  if (!React.isValidElement(children)) return null;

  return React.cloneElement(children, { itemId });
};

export default observer(WrapperItemIdParam);

//todo del
