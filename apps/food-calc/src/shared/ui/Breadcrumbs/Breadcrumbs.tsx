import clsx from 'clsx';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import s from './Breadcrumbs.module.scss';

type Props<T extends string> = {
  steps: T[];
  current: T;
  stepLabels: Record<T, string>;
  stepResults?: Partial<Record<T, React.ReactNode>>;
  /**
   * Шаги, на которых пользователь уже побывал в текущей сессии флоу.
   * Нужен `results`-варианту: у draft есть дефолты (время = сейчас,
   * порция = 100), поэтому `stepResults` непустой ещё до того, как шаг
   * пройден — без этого списка будущий шаг показался бы как завершённый.
   */
  visitedSteps?: readonly T[];
  onStepClick: (step: T) => void;
};

// `labels` — исходный вид (название вкладки + результат под ним).
// `results` — компактный трейл: только результаты пройденных шагов,
// разделённые жирной точкой. Название шага не дублируется (оно и так
// в заголовке модалки). Дефолт — `labels`, чтобы вид не менялся, пока
// вариант не переключат в DesignVariantsBar.
const DV_VARIANTS = ['labels', 'results'] as const;

// Видимый текст крошки `results`-вида — максимум 13 символов, дальше ellipsis.
// Режем по code points (`[...str]`), а не по UTF-16 code units — иначе эмодзи
// на границе 13-го символа разрезается на половину суррогатной пары → «�».
const MAX_CRUMB_CHARS = 13;
const truncateCrumb = (node: React.ReactNode): React.ReactNode => {
  if (typeof node !== 'string') return node;
  const chars = [...node];
  return chars.length > MAX_CRUMB_CHARS
    ? `${chars.slice(0, MAX_CRUMB_CHARS).join('')}…`
    : node;
};

function Breadcrumbs<T extends string>({
  steps,
  current,
  stepLabels,
  stepResults,
  visitedSteps,
  onStepClick,
}: Props<T>) {
  const { variant, anchor } = useDesignVariant('Breadcrumbs', DV_VARIANTS);

  if (variant === 'results') {
    // Трейл = ВСЕ посещённые шаги, в порядке флоу (порядок массива `steps`).
    // Текущий шаг не вырезаем — иначе при прыжке назад трейл «прыгает».
    // Содержимое крошки — результат шага; если результата нет (например,
    // пустые «Особенности») — название шага, чтобы посещённый шаг никогда
    // не пропадал из строки. Трейл только растёт, не тасуется.
    const trail = steps.filter((stepName) => visitedSteps?.includes(stepName) ?? false);

    return (
      <nav {...anchor} className={clsx(s.breadcrumbs, s.results)}>
        {trail.map((stepName, i) => (
          <span key={stepName} className={s.crumbWrapper}>
            {i > 0 && (
              <span className={s.dot} aria-hidden>
                ·
              </span>
            )}
            <button
              className={clsx(s.resultCrumb, stepName === current && s.resultCrumbCurrent)}
              onClick={() => onStepClick(stepName)}
              aria-label={stepLabels[stepName]}
              aria-current={stepName === current ? 'step' : undefined}
            >
              {truncateCrumb(stepResults?.[stepName] ?? stepLabels[stepName])}
            </button>
          </span>
        ))}
      </nav>
    );
  }

  return (
    <nav {...anchor} className={s.breadcrumbs}>
      {steps.map((stepName, i) => {
        const isClickable = current !== stepName;
        const isCurrent = current === stepName;
        const result = stepResults?.[stepName];

        return (
          <span key={stepName} className={s.crumbWrapper}>
            {i > 0 && <span className={s.separator}>/</span>}
            <button
              className={clsx(s.crumb, isClickable && s.completed, isCurrent && s.current)}
              onClick={() => isClickable && onStepClick(stepName)}
              disabled={!isClickable}
            >
              <span className={s.crumbLabel}>{stepLabels[stepName]}</span>
              {!isCurrent && result != null && <span className={s.crumbResult}>{result}</span>}
            </button>
          </span>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
