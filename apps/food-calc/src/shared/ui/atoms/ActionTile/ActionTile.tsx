import type { ReactNode } from 'react';
import clsx from 'clsx';
import { usePressFeedback } from '@/shared/lib/hooks/usePressFeedback';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import s from './ActionTile.module.scss';

// ── ActionTile — унифицированный примитив «быстрое действие / выбор из небольшого
// числа вариантов». ОДНА раскладка: слот графики справа (ghost-гравюра ИЛИ
// маленький глиф-стрелка), главное слово сверху, доп.инфо снизу, опц. caveat-строка
// (hint) и точка-маркер (dot), тир emphasis, press-инверсия чернил.
// Поглощает три живых места: дровер анализа, нижнюю панель поиска, нав-якоря дат.
//
// Облик ПОВЕРХНОСТИ — «мягкая карточка с тенью» (баком 2026-06-22, см.
// ActionTile.module.scss). Раньше переключался DesignBar'ом ('ActionTile' anchor,
// форки grad/shadow); форк grad снят, shadow запечён в базу.

type Props = {
  /** Главное слово — верхняя строка. */
  top: ReactNode;
  /** Доп.инфо — нижняя строка (подзаголовок / глагол / дата). */
  bottom?: ReactNode;
  /** Caveat-строка под инфо (warning-цвет) — напр. «Нет сети». */
  hint?: ReactNode;
  /** Графика справа: <img> (гравюра) или глиф-стрелка. */
  art?: ReactNode;
  /** Лёгкий акцент (основное действие / выбранный день). */
  emphasis?: boolean;
  /** Инверсная карта: тёмная система-поверхность + светлые чернила (напр. нав-плитка
   *  «Страница открытий» в дровере разбора). Постоянный аналог press-инверсии. */
  inverse?: boolean;
  /** Тихая точка «есть записи». */
  dot?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  /**
   * Если задан — плитка рендерится как `<label htmlFor>` (делегирование фокуса
   * в create-input, паттерн ModalByLabel), а не `<button>`.
   */
  htmlFor?: string;
  className?: string;
  'data-date'?: string;
};

export function ActionTile({
  top,
  bottom,
  hint,
  art,
  emphasis,
  inverse,
  dot,
  disabled,
  onClick,
  htmlFor,
  className,
  'data-date': dataDate,
}: Props) {
  const press = usePressFeedback();
  const cls = clsx(s.tile, emphasis && s.emphasis, inverse && s.inverse, className);
  const pressed = (!disabled && press.pressed) || undefined;

  const body = (
    <>
      {art ? (
        <span className={s.art} aria-hidden>
          {art}
        </span>
      ) : null}
      <span className={s.main}>
        <Heading role="title" as="span" className={s.top}>
          {top}
        </Heading>
        {bottom ? (
          <span className={s.bottomRow}>
            <Text as="span" role="caption" className={s.bottom}>{bottom}</Text>
            {dot ? <span className={s.dot} aria-hidden /> : null}
          </span>
        ) : null}
        {hint ? <Text as="span" role="caption" className={s.hint}>{hint}</Text> : null}
      </span>
    </>
  );

  // Label-делегирование: тап фокусирует create-input в другом месте DOM (focus
  // delegation), при этом onClick всё равно стреляет (стэшит выбранный вариант).
  if (htmlFor) {
    return (
      <label
        htmlFor={htmlFor}
        className={cls}
        data-date={dataDate}
        data-pressed={pressed}
        onClick={onClick}
        {...press.pressProps}
      >
        {body}
      </label>
    );
  }

  return (
    <button
      type="button"
      className={cls}
      disabled={disabled}
      data-date={dataDate}
      data-pressed={pressed}
      onClick={onClick}
      {...press.pressProps}
    >
      {body}
    </button>
  );
}

// Тонкий глиф-стрелка для нав-якорей (вчера ← / завтра →). stroke=currentColor —
// инвертируется в press вместе с текстом, как гравюра.
export function ArrowGlyph({ dir }: { dir: 'left' | 'right' | 'dot' }) {
  if (dir === 'dot') {
    // «Сегодня» — направления нет («ты здесь»): одиночная точка-маркер, НЕ
    // концентрические кольца (те читались как radio button).
    return (
      <svg className={s.glyph} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="3.4" fill="currentColor" />
      </svg>
    );
  }
  const flip = dir === 'left' ? 'scaleX(-1)' : undefined;
  return (
    <svg
      className={s.glyph}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={flip ? { transform: flip } : undefined}
    >
      <path
        d="M5 12h13M13 6.5 18.5 12 13 17.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
