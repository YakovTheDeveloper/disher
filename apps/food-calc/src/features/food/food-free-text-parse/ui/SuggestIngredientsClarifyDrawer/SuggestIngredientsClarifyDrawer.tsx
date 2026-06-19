import { useState } from 'react';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import type { BaseDrawerProps } from '@/shared/ui';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';
import { Button } from '@/shared/ui/atoms/Button';
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
  const [comment, setComment] = useState('');

  return (
    <DrawerLayout a11yLabel="Уточнения">
      <div className={s.body}>
        <Heading size="drawer" as="h2" className={s.title}>
          Уточнения
        </Heading>
        <AutoGrowSearch
          value={comment}
          onChange={setComment}
          onSubmit={() => onClose(comment)}
          placeholder="Что уточнить? Например: вегетарианский, без молочного"
          singleLine
          autoFocus
        />
        <Button variant="primary" onClick={() => onClose(comment)}>
          Предложить
        </Button>
      </div>
    </DrawerLayout>
  );
}

export default SuggestIngredientsClarifyDrawer;
