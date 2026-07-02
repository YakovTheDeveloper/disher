import clsx from 'clsx';
import { QuietLabel, Text } from '@/shared/ui/atoms/Typography';
import s from './Breadcrumbs.module.scss';

type Props<T extends string> = {
  steps: T[];
  current: T;
  stepLabels: Record<T, string>;
  stepResults?: Partial<Record<T, React.ReactNode>>;
  /**
   * Шаги, на которых пользователь уже побывал в текущей сессии флоу.
   * У draft есть дефолты (время = сейчас, порция = 100), поэтому
   * `stepResults` непустой ещё до того, как шаг пройден — без этого
   * списка будущий шаг показался бы как завершённый.
   */
  visitedSteps?: readonly T[];
  onStepClick: (step: T) => void;
};

// Видимый текст крошки — максимум 13 символов, дальше ellipsis. Режем по code
// points (`[...str]`), а не по UTF-16 code units — иначе эмодзи на границе
// 13-го символа разрезается на половину суррогатной пары → «�».
const MAX_CRUMB_CHARS = 13;
const truncateCrumb = (node: React.ReactNode): React.ReactNode => {
  if (typeof node !== 'string') return node;
  const chars = [...node];
  return chars.length > MAX_CRUMB_CHARS
    ? `${chars.slice(0, MAX_CRUMB_CHARS).join('')}…`
    : node;
};

// Компактный трейл: только результаты пройденных шагов, разделённые жирной
// точкой. Название шага не дублируется (оно и так в заголовке модалки).
function Breadcrumbs<T extends string>({
  steps,
  current,
  stepLabels,
  stepResults,
  visitedSteps,
  onStepClick,
}: Props<T>) {
  // Трейл = ВСЕ посещённые шаги, в порядке флоу (порядок массива `steps`).
  // Текущий шаг не вырезаем — иначе при прыжке назад трейл «прыгает».
  // Содержимое крошки — результат шага; если результата нет (например,
  // пустые «Особенности») — название шага, чтобы посещённый шаг никогда
  // не пропадал из строки. Трейл только растёт, не тасуется.
  const trail = steps.filter((stepName) => visitedSteps?.includes(stepName) ?? false);

  return (
    <nav className={clsx(s.breadcrumbs, s.results)}>
      {trail.map((stepName, i) => (
        <span
          key={stepName}
          className={clsx(s.crumbWrapper, stepName === current && s.crumbWrapperCurrent)}
        >
          {i > 0 && (
            <Text role="caption" as="span" className={s.dot} aria-hidden>
              ·
            </Text>
          )}
          <QuietLabel
            as="button"
            underline
            className={s.resultCrumb}
            onClick={() => onStepClick(stepName)}
            aria-label={stepLabels[stepName]}
            aria-current={stepName === current ? 'step' : undefined}
          >
            {truncateCrumb(stepResults?.[stepName] ?? stepLabels[stepName])}
          </QuietLabel>
        </span>
      ))}
    </nav>
  );
}

export default Breadcrumbs;
