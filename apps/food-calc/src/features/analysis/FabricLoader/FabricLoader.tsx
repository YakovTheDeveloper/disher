import { memo, type CSSProperties } from 'react';
import { Numeral, Text } from '@/shared/ui/atoms/Typography';
import styles from './FabricLoader.module.scss';

// Лоадер анализа дня. Над бледной гравюрой-библиотекой (art) анимация работает с
// самой картинкой (без концентрической ауры). Три слоя: база (::before),
// проявляющая копия (::after), тёплый свет лампы (.glow). Характер анимации —
// проп `effect` (баком 2026-06-22 переведён из DesignBar в API компонента):
//   scan      — световая полоса проявляет гравюру слева направо (дефолт);
//   glow      — по гравюре дрейфует тёплый свет лампы;
//   study     — наезд (Ken Burns) + пульс-лампа из центра + тёплый свет вместе;
//   scan-glow — проявляющая полоса и тёплый свет одновременно.
// Под картинкой подпись (Alice, основной цвет).
export type FabricLoaderEffect = 'scan' | 'glow' | 'study' | 'scan-glow';

type Props = {
  /** Цифра в центре — число дня (dd). Показывается, только если нет `art`. */
  day?: string;
  /** Картинка-гравюра под анимацией (url). */
  art?: string;
  /** Подпись под лоадером. */
  caption?: string;
  /** Характер анимации над гравюрой. */
  effect?: FabricLoaderEffect;
};

const FabricLoader = ({ day, art, caption = 'Разбираем день…', effect = 'scan' }: Props) => {
  return (
    <div className={styles.loader} role="status" aria-label={caption}>
      <div className={styles.stage} data-effect={effect}>
        {art ? (
          <div
            className={styles.art}
            style={{ '--fl-art': `url("${art}")` } as CSSProperties}
            aria-hidden
          >
            {/* базовый слой — реальный <img>: задаёт размер блока и работает с
                картинкой любых пропорций (для переиспользования). Проявляющая
                копия (::after) и свет (.glow) лежат поверх через background/inset. */}
            <img className={styles.artBase} src={art} alt="" decoding="async" />
            <span className={styles.glow} />
          </div>
        ) : (
          day && (
            <div className={styles.digit}>
              <Numeral size="display" weight="black" className={styles.day}>
                {day}
              </Numeral>
            </div>
          )
        )}
      </div>

      <Text role="body" className={styles.caption}>
        {caption}
      </Text>
    </div>
  );
};

export default memo(FabricLoader);
