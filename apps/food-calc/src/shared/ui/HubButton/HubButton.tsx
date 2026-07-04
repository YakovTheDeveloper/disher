import type { ReactNode } from 'react';
import styles from './HubButton.module.scss';

type Props = {
  onClick: () => void;
  /** a11y-метка кнопки — что откроется (напр. «Разбор — открытия и анализ»). */
  ariaLabel: string;
  /** Глиф-подпись. По умолчанию — бренд-«О!». */
  children?: ReactNode;
};

// «О!» hub-кнопка — персональный bespoke бренд-глиф (курсивная «О» + «!»),
// вынесен из HomeTopBar в shared-примитив (2026-07-04), чтобы страница блюда
// могла отрисовать ту же кнопку со своим onClick (DishHubDrawer), а HomePage —
// со своим (AnalysisHubDrawer). Стиль `.hubButton` переехал сюда 1:1.
export const HubButton = ({ onClick, ariaLabel, children = 'О!' }: Props) => (
  <button type="button" className={styles.hubButton} onClick={onClick} aria-label={ariaLabel}>
    {children}
  </button>
);

export default HubButton;
