import { useEffect, useRef, useState } from 'react';
import styles from './useStepEnterAnimation.module.scss';

type StepEnterProps = {
  /** React-`key` для обёртки анимируемого блока — меняется на КАЖДЫЙ вход в шаг. */
  replayKey: number;
  className: string;
};

/**
 * useStepEnterAnimation — одноразовое «мягкое появление» для ПОСТОЯННО
 * смонтированного элемента. В отличие от `useEntranceStagger` (ловит маунт ряда),
 * заголовки wizard-флоу идут через `ModalByLabel`: все шаги всегда в DOM, активный
 * лишь раскрывается CSS — `ModalStepHeader` НЕ перемонтируется при смене шага, так
 * что mount-триггер здесь не сработает (useState-init прочитал бы сигнал один раз
 * на первом маунте и больше никогда).
 *
 * Вместо этого ловим переход `active` (этот шаг стал текущим) false→true и
 * переигрываем CSS-анимацию, меняя React-`key` обёртки (remount → анимация
 * стартует заново). Повторяется на каждый вход в шаг (в т.ч. возврат назад), но
 * не переигрывается на обычных ре-рендерах.
 *
 *   const enter = useStepEnterAnimation(active);
 *   <div key={enter.replayKey} className={enter.className}>…</div>
 *
 * `active` не передан / false → без анимации (статичные консументы инертны).
 */
export function useStepEnterAnimation(active = false): StepEnterProps {
  const [replayKey, setReplayKey] = useState(0);
  const prevActive = useRef(active);
  useEffect(() => {
    if (active && !prevActive.current) setReplayKey((k) => k + 1);
    prevActive.current = active;
  }, [active]);
  return { replayKey, className: styles.stepEnter };
}
