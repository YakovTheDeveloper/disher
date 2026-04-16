import { FC, useState, useCallback } from 'react';
import Button from '@/shared/ui/atoms/Button/Button';
import s from './FoodPortionsManager.module.scss';

type Portion = { label: string; amount: number; unit: string; grams: number };

type Props = {
  portions: Portion[];
  onAdd?: (portion: Portion) => void;
  onUpdate?: (label: string, updates: Partial<Portion>) => void;
  onRemove?: (label: string) => void;
};

type EditState =
  | { mode: 'idle' }
  | { mode: 'adding'; draft: { label: string; grams: number } }
  | { mode: 'editing'; editingLabel: string; draft: { label: string; grams: number } };

const FoodPortionsManager: FC<Props> = ({ portions, onAdd, onUpdate, onRemove }) => {
  const editable = !!(onAdd && onUpdate && onRemove);
  const [state, setState] = useState<EditState>({ mode: 'idle' });

  const isEditing = state.mode !== 'idle';
  const draft = state.mode !== 'idle' ? state.draft : null;
  const isValid = draft ? draft.label.trim().length > 0 && draft.grams > 0 : false;

  const startAdding = useCallback(() => {
    setState({ mode: 'adding', draft: { label: '', grams: 0 } });
  }, []);

  const startEditing = useCallback((label: string, grams: number) => {
    setState({ mode: 'editing', editingLabel: label, draft: { label, grams } });
  }, []);

  const cancel = useCallback(() => {
    setState({ mode: 'idle' });
  }, []);

  const updateDraft = useCallback((field: 'label' | 'grams', value: string | number) => {
    setState((prev) => {
      if (prev.mode === 'idle') return prev;
      return { ...prev, draft: { ...prev.draft, [field]: value } };
    });
  }, []);

  const handleSave = () => {
    if (!draft || !isValid) return;

    if (state.mode === 'adding') {
      onAdd?.({
        label: draft.label.trim(),
        amount: 1,
        unit: 'порц.',
        grams: draft.grams,
      });
    } else if (state.mode === 'editing') {
      onUpdate?.(state.editingLabel, {
        label: draft.label.trim(),
        grams: draft.grams,
      });
    }

    cancel();
  };

  const handleGramsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    updateDraft('grams', val ? parseInt(val, 10) : 0);
  };

  return (
    <div className={s.container}>
      {portions.length === 0 && !isEditing && (
        <div className={s.empty}>нет порций</div>
      )}

      <div className={s.list}>
        {portions.map((p) => (
          <div key={p.label} className={s.portion}>
            <div className={s.portionInfo}>
              <span className={s.portionLabel}>{p.label}</span>
              <span className={s.portionGrams}>{p.grams} г</span>
            </div>
            {editable && (
              <div className={s.portionActions}>
                <button
                  className={s.iconButton}
                  onClick={() => startEditing(p.label, p.grams)}
                >
                  ✎
                </button>
                <button
                  className={s.iconButton}
                  onClick={() => onRemove?.(p.label)}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isEditing && draft && (
        <div className={s.form}>
          <div className={s.formRow}>
            <input
              className={s.formInput}
              placeholder="название"
              value={draft.label}
              onChange={(e) => updateDraft('label', e.target.value)}
              autoFocus
            />
            <input
              className={s.formInputGrams}
              placeholder="г"
              value={draft.grams || ''}
              onChange={handleGramsInput}
            />
          </div>
          <div className={s.formActions}>
            <Button variant="ghost" onClick={cancel}>
              отмена
            </Button>
            <Button variant="ghost" onClick={handleSave} disabled={!isValid}>
              сохранить
            </Button>
          </div>
        </div>
      )}

      {editable && !isEditing && (
        <button className={s.addButton} onClick={startAdding}>
          + добавить порцию
        </button>
      )}
    </div>
  );
};

export default FoodPortionsManager;
