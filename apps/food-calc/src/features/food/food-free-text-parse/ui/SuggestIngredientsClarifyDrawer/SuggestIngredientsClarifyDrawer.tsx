import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import type { BaseDrawerProps } from '@/shared/ui';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Typography';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import s from './SuggestIngredientsClarifyDrawer.module.scss';

// Optional «Уточнения» step before head-A ("infer ingredients"). Resolves the
// drawer promise with the typed comment string (possibly empty — that's a valid
// "proceed without clarification") on «Предложить». A cancel/swipe-dismiss
// resolves `undefined`, which the caller treats as "don't suggest at all".
//
// The empty-string-vs-undefined split is deliberate: it lets the caller tell a
// deliberate skip (proceed, no comment) apart from a real cancel.
type Props = BaseDrawerProps<string>;

export function SuggestIngredientsClarifyDrawer({ onClose }: Props) {
  const { t } = useTranslation();
  const [comment, setComment] = useState('');

  return (
    <DrawerLayout title="Уточнения">
      <div className={s.body}>
        {/* Вводная подсказка: что делает функция и что она ДОБАВЛЯет к текущему
            составу, ничего не удаляя (append-флоу). */}
        <Text role="caption" className={s.intro}>
          Подберём ингредиенты по названию блюда и добавим совпадения к текущему
          составу — ничего не удаляя.
        </Text>
        <AutoGrowSearch
          value={comment}
          onChange={setComment}
          onSubmit={() => onClose(comment)}
          placeholder={t('food.freeText.clarifyPlaceholder')}
          singleLine
          autoFocus
        />
        <Button variant="system" onClick={() => onClose(comment)}>
          Предложить
        </Button>
      </div>
    </DrawerLayout>
  );
}

export default SuggestIngredientsClarifyDrawer;
