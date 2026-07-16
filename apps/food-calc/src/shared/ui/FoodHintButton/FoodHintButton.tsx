import type { ReactNode } from 'react';
import { PopoverTrigger } from '@/shared/ui/popover/PopoverTrigger';
import { InfoButton } from '@/shared/ui/atoms/Button';
import type { IconButtonTone } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Typography';
import styles from './FoodHintButton.module.scss';

// Свободный текст описания — место для состава БАД-компонентов, которые НЕ
// отслеживаются как нутриенты. Дефолт-подсказка объясняет это.
const DEFAULT_HINT =
  'Если это БАД, можно добавить состав дополнительных компонентов (не нутриенты).';

type Props = {
  /** Контент поповера. Дефолт — подсказка про состав БАД. */
  hint?: ReactNode;
  /** a11y-метка кнопки ⓘ. */
  ariaLabel?: string;
  /** Сторона тап-таргета (px). Дефолт 44 — канон-плитка ⓘ для шапки модалки. В
   *  трейлинге лейбла формы передаётся компактный размер, чтобы ⓘ не была выше
   *  текста метки. */
  size?: number;
  /** Сторона глифа ⓘ (px). Без значения — дефолт InfoButton (24, под плитку 44). */
  glyphSize?: number;
  /** Тон кнопки. Дефолт `soft` — видимая ink-плитка (канон ⓘ). Компактный
   *  трейлинг лейбла тоже держит `soft`, чтобы голый глиф не терялся. */
  tone?: IconButtonTone;
};

// Кнопка-подсказка ⓘ рядом с полем «Описание»: композит InfoButton (глиф) +
// PopoverTrigger (клик → плавающая панель). Выделена в примитив, т.к. один и тот
// же хинт висит в create-форме еды и в модалке правки описания.
export const FoodHintButton = ({
  hint = DEFAULT_HINT,
  ariaLabel = 'Подсказка про описание',
  size = 44,
  glyphSize = 24,
  tone = 'soft',
}: Props) => (
  <PopoverTrigger
    placement="bottom-end"
    trigger={<InfoButton tone={tone} size={size} glyphSize={glyphSize} aria-label={ariaLabel} />}
    content={
      <Text as="p" role="caption" className={styles.hint}>
        {hint}
      </Text>
    }
  />
);

export default FoodHintButton;
