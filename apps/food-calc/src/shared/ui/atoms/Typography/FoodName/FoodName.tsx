import styles from './FoodName.module.scss';
import clsx from 'clsx';
import { ChangeHighlight } from '@/shared/ui/ChangeHighlight';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';

type Props = {
  onClick?: () => void;
  onTouchEnd?: (e: React.TouchEvent<HTMLElement>) => void;
  after?: React.ReactNode;
  className?: string;
  content: { name: string } | null;
  htmlFor?: string;
};

// FoodName — доменная обёртка имени продукта: capitalize + ellipsis + sweep-
// анимация смены значения. Рендерит свой <p>/<label> (как <label> при htmlFor —
// для label-driven rename-флоу). Голос наследуется от консумера; типографику не
// навязывает (это не Heading/Text-роль, а имя-сущности).
const FoodName = ({ className, onClick, onTouchEnd, after, content, htmlFor }: Props) => {
  const initTitle = content?.name;
  const normalizedTitle = initTitle || 'не выбрано';

  const cls = clsx(styles.ellipsis, styles.capitalize, !initTitle && styles.noTitle, className);
  const handleTouchEnd = onTouchEnd
    ? () => onTouchEnd({} as React.TouchEvent<HTMLElement>)
    : undefined;
  const inner = (
    <>
      <ChangeHighlight trigger={initTitle} variant="sweep">
        {normalizedTitle}
      </ChangeHighlight>
      {after}
    </>
  );

  return htmlFor ? (
    <Heading role="title" className={cls} as="label" htmlFor={htmlFor} onClick={onClick}>
      {inner}
    </Heading>
  ) : (
    <Heading role="title" className={cls} onClick={onClick} onTouchEnd={handleTouchEnd}>
      {inner}
    </Heading>
  );
};

export default FoodName;
