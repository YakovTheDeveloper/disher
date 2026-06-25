import { memo, useCallback, useMemo, useState } from 'react';
import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import Button from '@/shared/ui/atoms/Button/Button';
import type { Hypothesis } from '@/entities/hypothesis';
import HypothesisListPanel from '@/widgets/Laboratory/HypothesisListPanel';
import { Text } from '@/shared/ui/atoms/Typography';
import s from './AttachHypothesesPicker.module.scss';

type Props = BaseDrawerProps<void> & {
  hypotheses: Hypothesis[];
  /** Selection the bar already holds — seeds the local checkboxes. */
  initialSelectedIds: Set<string>;
  /** Live sync back to the bar on every toggle (so a swipe-dismiss keeps edits). */
  onChange: (ids: Set<string>) => void;
};

/**
 * Bottom-sheet picker for «которые гипотезы приложить к ЭТОМУ разбору»: a
 * search-by-name field over the hypothesis list with selection checkboxes
 * (reuses HypothesisListPanel, which carries the MAX_SELECTED=10 cap + hint).
 * Selection commits live via `onChange` — the bar owns the source of truth.
 */
const AttachHypothesesPicker = ({ hypotheses, initialSelectedIds, onChange, onClose }: Props) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(initialSelectedIds));
  const [query, setQuery] = useState('');

  const handleToggle = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        onChange(next);
        return next;
      });
    },
    [onChange],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hypotheses;
    return hypotheses.filter(
      (h) => h.title.toLowerCase().includes(q) || h.body.toLowerCase().includes(q),
    );
  }, [hypotheses, query]);

  return (
    <DrawerLayout
      title="Гипотезы для разбора"
      a11yLabel="Выбор гипотез для разбора"
      // Пинованная «Подтвердить» появляется, как только выбрана ≥1 гипотеза:
      // выбор и так коммитится живьём через onChange, кнопка лишь закрывает
      // дровер (явное завершение вместо свайпа). Нет выбора → нет кнопки.
      footer={
        selectedIds.size > 0 ? (
          <div className={s.footer}>
            <Button variant="system" center onClick={() => onClose()}>
              Подтвердить
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className={s.body}>
        {hypotheses.length === 0 ? (
          <Text role="caption" className={s.empty}>Пока нет гипотез — создай их кнопкой «Гипотезы».</Text>
        ) : (
          <>
            <AutoGrowSearch
              value={query}
              onChange={setQuery}
              placeholder="Найти гипотезу…"
              singleLine
            />
            <HypothesisListPanel
              hypotheses={filtered}
              selectedIds={selectedIds}
              onToggle={handleToggle}
              maxBodyHeight="none"
            />
          </>
        )}
      </div>
    </DrawerLayout>
  );
};

export default memo(AttachHypothesesPicker);
