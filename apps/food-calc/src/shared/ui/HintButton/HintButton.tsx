import type { ReactNode } from 'react';
import { PopoverTrigger } from '@/shared/ui/popover/PopoverTrigger';
import { InfoButton } from '@/shared/ui/atoms/Button';
import type { IconButtonTone } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Typography';
import styles from './HintButton.module.scss';

type Props = {
  /** Контент поповера — обязателен. Примитив доменно-нейтрален: текст подсказки
   *  всегда задаёт потребитель (напр. хинт про состав БАД живёт в консумере). */
  hint: ReactNode;
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

// Кнопка-подсказка ⓘ: доменно-нейтральный композит InfoButton (глиф) +
// PopoverTrigger (клик → плавающая бумажка-поповер). Один примитив на всё
// приложение — тот же ⓘ висит в create-форме еды, в модалке правки описания и
// в подсказках write-баров; текст подсказки всегда приходит извне (`hint`).
export const HintButton = ({
  hint,
  ariaLabel = 'Подсказка',
  size = 44,
  glyphSize = 24,
  tone = 'soft',
}: Props) => (
  <PopoverTrigger
    placement="bottom-end"
    variant="hint"
    trigger={<InfoButton tone={tone} size={size} glyphSize={glyphSize} aria-label={ariaLabel} />}
    content={
      <Text as="div" role="hint" className={styles.hint}>
        {hint}
      </Text>
    }
  />
);

export default HintButton;
