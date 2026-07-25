import { ActionList } from '@/shared/ui/ActionList';
import { SettingRow } from '@/shared/ui/atoms/SettingRow';
import TickIcon from '@/shared/assets/icons/tick.svg?react';
import {
  useNutrientAppearanceStore,
  type NutrientHeroVariant,
  type NutrientTrackVariant,
} from '@/entities/nutrient/model';
import s from './NutrientAppearanceSettings.module.scss';

/**
 * Оформление витрины нутриентов — ось hero-секции + ось прогресс-трека карточек
 * (2026-07-25, запрос: вынесено из ProfileDrawer для переиспользования). Выбор —
 * radio-ряды (тик у выбранного), пишется в nutrient-appearance-store, витрина
 * NutrientTotals читает сразу. Два дома: под-экран «Настройки → Внешний вид →
 * Нутриенты» (ProfileDrawer) и аккордеон «Оформление» в хвосте самой витрины.
 */
export function NutrientAppearanceSettings({ className }: { className?: string }) {
  const hero = useNutrientAppearanceStore((s) => s.hero);
  const track = useNutrientAppearanceStore((s) => s.track);
  const setHero = useNutrientAppearanceStore((s) => s.setHero);
  const setTrack = useNutrientAppearanceStore((s) => s.setTrack);
  return (
    <ActionList className={className}>
      <ActionList.Section as="h3" label="Hero-секция">
        <div className={s.rows} role="radiogroup" aria-label="Hero-секция">
          {(
            [
              ['boxes', 'Ведомость', 'Сетка 3×2 с треками'],
              ['circles', 'Кольца', 'Доля нормы дугой'],
              ['raw', 'Карточки', 'Как остальные группы, без hero'],
            ] as [NutrientHeroVariant, string, string][]
          ).map(([value, label, sub]) => (
            <SettingRow
              key={value}
              label={label}
              sub={sub}
              trailing={hero === value ? <TickIcon width={18} height={18} /> : undefined}
              onClick={() => setHero(value)}
              aria-label={`Hero-секция: ${label}`}
            />
          ))}
        </div>
      </ActionList.Section>

      <ActionList.Section as="h3" label="Прогресс-трек карточек">
        <div className={s.rows} role="radiogroup" aria-label="Прогресс-трек карточек">
          {(
            [
              ['inCell', 'В ячейке нормы', 'Тонкий рельс под процентом'],
              ['fullWidth', 'Во всю ширину', 'Рельс под всей карточкой'],
              ['fill', 'Заливка карточки', 'Фон растёт слева направо'],
              ['none', 'Без трека', 'Только числа'],
            ] as [NutrientTrackVariant, string, string][]
          ).map(([value, label, sub]) => (
            <SettingRow
              key={value}
              label={label}
              sub={sub}
              trailing={track === value ? <TickIcon width={18} height={18} /> : undefined}
              onClick={() => setTrack(value)}
              aria-label={`Прогресс-трек: ${label}`}
            />
          ))}
        </div>
      </ActionList.Section>
    </ActionList>
  );
}

export default NutrientAppearanceSettings;
