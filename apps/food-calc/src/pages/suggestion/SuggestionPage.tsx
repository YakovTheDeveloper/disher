import { useState, type ComponentType } from 'react';
import clsx from 'clsx';

import { nutrientGroups } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { NutrientRow } from '@/entities/nutrient/ui/NutrientRow';
import { Chip } from '@/shared/ui/atoms/Chip/Chip';

// Реальный модуль стилей текущего пикера — импортируем, чтобы вариант C
// рендерился ЕГО настоящими классами (.chip / .chipActive / .list / .group),
// а не переизобретённой копией. Тот же приём, что в UiKitPage.
import pickerStyles from '@/features/food/food-search/NutrientPickerDrawer/NutrientPickerDrawer.module.scss';

import s from './SuggestionPage.module.scss';

// Превью на двух первых группах (БЖУ + Минералы = 19 элементов) — этого хватает,
// чтобы увидеть разницу «пилюли с переносом» vs «длинный список рядов».
const PREVIEW_GROUPS = nutrientGroups.slice(0, 2);
const DEFAULT_PICK = '1'; // Белки

/** Вариант C (принят и внедрён) — пикер теперь ест общий Chip: navy активный. */
const CurrentPillsPreview: ComponentType = () => {
  const [picked, setPicked] = useState(DEFAULT_PICK);
  return (
    <div className={pickerStyles.root}>
      {PREVIEW_GROUPS.map((group) => (
        <section key={group.name} className={pickerStyles.group} aria-label={group.displayName}>
          <p className={pickerStyles.groupTitle}>{group.displayName}</p>
          <div className={pickerStyles.list}>
            {group.content.map((n) => (
              <Chip
                key={n.id}
                active={n.id === picked}
                aria-pressed={n.id === picked}
                onClick={() => setPicked(n.id)}
              >
                {n.displayNameRu}
              </Chip>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

/** Вариант A — переезд на общий NutrientRow (как в таблице нутриентов). */
const RowsPreview: ComponentType = () => {
  const [picked, setPicked] = useState(DEFAULT_PICK);
  return (
    <div className={s.previewBody}>
      {PREVIEW_GROUPS.map((group) => (
        <section key={group.name} className={s.previewGroup} aria-label={group.displayName}>
          <p className={s.previewGroupTitle}>{group.displayName}</p>
          <div className={s.rowsList}>
            {group.content.map((n) => (
              <NutrientRow
                key={n.id}
                name={n.displayNameRu}
                unit={n.unitRu}
                onClick={() => setPicked(n.id)}
                className={n.id === picked ? s.selectedSim : undefined}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

/** Вариант B — общий примитив Chip (тёплый канон «Особенности приёма»). */
const ChipPreview: ComponentType = () => {
  const [picked, setPicked] = useState(DEFAULT_PICK);
  return (
    <div className={s.previewBody}>
      {PREVIEW_GROUPS.map((group) => (
        <section key={group.name} className={s.previewGroup} aria-label={group.displayName}>
          <p className={s.previewGroupTitle}>{group.displayName}</p>
          <div className={s.chipWrap}>
            {group.content.map((n) => (
              <Chip
                key={n.id}
                active={n.id === picked}
                aria-pressed={n.id === picked}
                onClick={() => setPicked(n.id)}
              >
                {n.displayNameRu}
              </Chip>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

type OptionDef = {
  key: string;
  label: string;
  recommended?: boolean;
  title: string;
  caption: string;
  changes: string[];
  Preview: ComponentType;
};

const OPTIONS: OptionDef[] = [
  {
    key: 'C',
    label: 'C',
    recommended: true,
    title: 'Оставить пилюли, починить только долг',
    caption: 'Как сейчас в дровере',
    changes: [
      'Вид не меняется — белые пилюли, синий активный.',
      'Чиню устаревший докстринг NutrientRow (убираю ложное «владеет пикером»).',
      'Пилюли с переносом уместны для 40+ коротких ярлыков — рядам тут хуже.',
      'Остаётся ~40 строк локального CSS пилюли (общего «selectable pill» в kit нет).',
    ],
    Preview: CurrentPillsPreview,
  },
  {
    key: 'A',
    label: 'A',
    title: 'Переехать на общий NutrientRow',
    caption: 'Мок: ряды + selected-состояние',
    changes: [
      'Пилюли → полноширинные ряды (имя слева, юнит справа, бровка).',
      'Объединяет пикер с таблицей нутриентов — один примитив строки.',
      'Минус: 40+ нутриентов рядами = длинный скролл вместо компактного грида.',
      'Нужно добавить NutrientRow состояние selected — сейчас его нет.',
    ],
    Preview: RowsPreview,
  },
  {
    key: 'B',
    label: 'B',
    title: 'Переехать на примитив Chip',
    caption: 'Тёплый канон Chip',
    changes: [
      'Остаются пилюли, но канон Chip: тёплый градиент + border.',
      'Текст крупнее (16px вместо ~12.8px), активный — коричневый, не синий.',
      'Семантически Chip — это теги «Особенности приёма», другое назначение.',
      'Chip хардкодит font-size — сохранить текущий размер чисто токенами нельзя.',
    ],
    Preview: ChipPreview,
  },
];

/**
 * Dev-песочница предложений по унификации UI-kit. Роут `/suggestion`.
 * Рендерит ЖИВЫЕ варианты предлагаемых изменений рядом — решение принимается
 * по картинке, а не по описанию. Первый разбор — п.1: пикер нутриентов.
 * Lazy, вне основного бандла (см. router.tsx).
 */
export default function SuggestionPage() {
  return (
    <main className={s.page} aria-labelledby="suggestion-title">
      <header className={s.head}>
        <p className={s.kicker}>Песочница предложений · dev</p>
        <h1 id="suggestion-title" className={s.h1}>
          Унификация UI-kit
        </h1>
        <p className={s.lead}>
          Живое превью вариантов, которые я предлагаю. Тыкай — активный элемент
          реагирует. Реши по картинке, потом вернёмся к вопросу.
        </p>
      </header>

      <section className={s.case} aria-labelledby="case-1-title">
        <div className={s.caseHead}>
          <span className={s.caseTag}>П.1</span>
          <h2 id="case-1-title" className={s.h2}>
            Пикер нутриентов · NutrientPickerDrawer
          </h2>
        </div>
        <p className={s.scenario}>
          <b>Сценарий.</b> Боковой дровер «Еда богатая нутриентом»: список
          нутриентов по группам, тап выбирает один. Сейчас он рисует свои пилюли
          (белая + синий активный) мимо общих примитивов. Рядом-стоящий{' '}
          <code>NutrientRow</code> в докстринге уверяет, что он «единый источник
          стиля для пикера», но пикер на него так и не переехал — его реально
          использует только таблица нутриентов. Это не дубль, а рассинхрон:
          вопрос — куда сводить или признать пилюли намеренными.
        </p>

        <div className={s.grid}>
          {OPTIONS.map((opt) => {
            const Preview = opt.Preview;
            return (
              <article
                key={opt.key}
                className={clsx(s.col, opt.recommended && s.colRec)}
              >
                <div className={s.colHead}>
                  <span className={clsx(s.badge, opt.recommended && s.badgeRec)}>
                    {opt.label}
                    {opt.recommended ? ' · рекомендую' : ''}
                  </span>
                  <h3 className={s.colTitle}>{opt.title}</h3>
                </div>
                <ul className={s.changes}>
                  {opt.changes.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <figure className={s.preview}>
                  <figcaption className={s.previewCap}>{opt.caption}</figcaption>
                  <div className={s.frame} role="group" aria-label={`Превью варианта ${opt.label}`}>
                    <Preview />
                  </div>
                </figure>
              </article>
            );
          })}
        </div>

        <aside className={s.verdict}>
          <p className={s.verdictTitle}>Моя рекомендация — C</p>
          <p className={s.verdictText}>
            Разнообразие здесь частично оправдано лейаутом: пилюли с переносом
            компактнее рядов для длинного списка коротких ярлыков. Реальный долг —
            только устаревший докстринг NutrientRow. Гнать пикер в ряды (A) или в
            Chip (B) силой = ухудшить UX или сменить вид ради формального
            единообразия. Если же цель — один «selectable pill» на весь kit, это
            отдельная, более крупная задача (новый примитив), а не правка пикера.
          </p>
        </aside>
      </section>
    </main>
  );
}
