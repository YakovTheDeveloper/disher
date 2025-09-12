import { Button } from '@/components/blocks/builders/food/shared/ui/Actions/button';
import React from 'react';

type Props = {
  children: React.ReactNode;
  isShow: boolean;
};

const Actions = ({ children, isShow }: Props) => {
  if (!isShow) return null;
  return <>{children}</>;
};

export default Actions;
