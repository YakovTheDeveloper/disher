import { memo } from 'react';
import { useNow, formatNow } from '@/shared/lib/time/useNow';

type Props = {
  time: string;
  children: React.ReactNode;
  onFinish: (time: string) => void;
};

const TimeNow = ({ onFinish, time, children }: Props) => {
  const timeNow = useNow();

  const onNowSelect = () => {
    onFinish(formatNow(new Date()));
  };

  if (timeNow === time) return null;

  return <div onClick={onNowSelect}>{children}</div>;
};

export default memo(TimeNow);
