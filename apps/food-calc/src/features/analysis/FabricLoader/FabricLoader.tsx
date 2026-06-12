import { memo, type CSSProperties } from 'react';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import styles from './FabricLoader.module.scss';

// Лоадер анализа дня. Над бледной гравюрой-библиотекой (art) анимация работает с
// самой картинкой (без концентрической ауры). Три слоя: база (::before),
// проявляющая копия (::after), тёплый свет лампы (.glow). Характеры — DesignBar
// 'AnalysisLoader':
//   scan      — световая полоса проявляет гравюру слева направо;
//   glow      — по гравюре дрейфует тёплый свет лампы;
//   study     — наезд (Ken Burns) + пульс-лампа из центра + тёплый свет вместе;
//   scan-glow — проявляющая полоса и тёплый свет одновременно.
// Под картинкой подпись (Alice, основной цвет).
const VARIANTS = ['scan', 'glow', 'study', 'scan-glow'] as const;

type Props = {
  /** Цифра в центре — число дня (dd). Показывается, только если нет `art`. */
  day?: string;
  /** Картинка-гравюра под анимацией (url). */
  art?: string;
  /** Подпись под лоадером. */
  caption?: string;
};

const FabricLoader = ({ day, art, caption = 'Разбираем день…' }: Props) => {
  const { anchor } = useDesignVariant('AnalysisLoader', VARIANTS);

  return (
    <div className={styles.loader} role="status" aria-label={caption}>
      <div className={styles.stage} {...anchor}>
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
              <span className={styles.day}>{day}</span>
            </div>
          )
        )}
      </div>

      <p className={styles.caption}>{caption}</p>
    </div>
  );
};

export default memo(FabricLoader);
