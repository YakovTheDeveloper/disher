import { create } from 'zustand';
import s from './ToggleStyleButton.module.scss';

const STYLE_COUNT = 10;

export const useStyleVariant = create<{ variant: number; next: () => void }>((set) => ({
  variant: 0,
  next: () => set((state) => ({ variant: (state.variant + 1) % STYLE_COUNT })),
}));

export function ToggleStyleButton() {
  const { variant, next } = useStyleVariant();

  return (
    <button className={s.trigger} onClick={next} aria-label="Toggle style">
      {variant + 1}
    </button>
  );
}
