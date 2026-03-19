import { FC, useMemo } from 'react';
import { PortionsManagerController } from './PortionsController';
import Button from '@/shared/ui/atoms/Button/Button';
import s from './FoodPortionsManager.module.scss';

type Portion = { label: string; amount: number; unit: string; grams: number };

type Props = {
  portions: Portion[];
  onAdd: (portion: Portion) => void;
  onUpdate: (label: string, updates: Partial<Portion>) => void;
  onRemove: (label: string) => void;
};

const FoodPortionsManager: FC<Props> = ({ portions, onAdd, onUpdate, onRemove }) => {
  const ctrl = useMemo(() => new PortionsManagerController(), []);

  const handleSave = () => {
    if (!ctrl.isValid) return;

    if (ctrl.isAdding) {
      onAdd({
        label: ctrl.draft.label.trim(),
        amount: 1,
        unit: 'порц.',
        grams: ctrl.draft.grams,
      });
    } else if (ctrl.editingLabel) {
      onUpdate(ctrl.editingLabel, {
        label: ctrl.draft.label.trim(),
        grams: ctrl.draft.grams,
      });
    }

    ctrl.cancel();
  };

  const handleGramsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    ctrl.updateDraft('grams', val ? parseInt(val, 10) : 0);
  };

  return (
    <div className={s.container}>
      {portions.length === 0 && !ctrl.isEditing && (
        <div className={s.empty}>нет порций</div>
      )}

      <div className={s.list}>
        {portions.map((p) => (
          <div key={p.label} className={s.portion}>
            <div className={s.portionInfo}>
              <span className={s.portionLabel}>{p.label}</span>
              <span className={s.portionGrams}>{p.grams} г</span>
            </div>
            <div className={s.portionActions}>
              <button
                className={s.iconButton}
                onClick={() => ctrl.startEditing(p.label, p.grams)}
              >
                ✎
              </button>
              <button
                className={s.iconButton}
                onClick={() => onRemove(p.label)}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {ctrl.isEditing && (
        <div className={s.form}>
          <div className={s.formRow}>
            <input
              className={s.formInput}
              placeholder="название"
              value={ctrl.draft.label}
              onChange={(e) => ctrl.updateDraft('label', e.target.value)}
              autoFocus
            />
            <input
              className={s.formInputGrams}
              placeholder="г"
              value={ctrl.draft.grams || ''}
              onChange={handleGramsInput}
            />
          </div>
          <div className={s.formActions}>
            <Button variant="ghost" onClick={() => ctrl.cancel()}>
              отмена
            </Button>
            <Button variant="ghost" onClick={handleSave} disabled={!ctrl.isValid}>
              сохранить
            </Button>
          </div>
        </div>
      )}

      {!ctrl.isEditing && (
        <button className={s.addButton} onClick={() => ctrl.startAdding()}>
          + добавить порцию
        </button>
      )}
    </div>
  );
};

export default FoodPortionsManager;
