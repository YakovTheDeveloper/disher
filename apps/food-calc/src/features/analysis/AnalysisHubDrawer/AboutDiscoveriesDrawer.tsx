import type { FC } from 'react';
import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import s from './AboutDiscoveriesDrawer.module.scss';

// Объяснялка раздела «Открытия» за ⓘ-кнопкой хаба разбора. Стекается ПОВЕРХ
// AnalysisHubDrawer (drawerStore.show) — хаб не закрываем. Тон спокойный/ясный:
// что такое разбор, инсайт, гипотеза и куда всё это копится. Заголовок дровера =
// h2 (DrawerLayout), под-заголовки внутри = h3 (корректный document outline).
// FC<BaseDrawerProps<void>> вместо неиспользуемого param `_` — держит контракт
// drawerStore.show (P extends BaseDrawerProps), но без unused-var. onClose тут не
// нужен: закрытие несёт крест/свайп DrawerLayout, хаб под стеком не трогаем.
export const AboutDiscoveriesDrawer: FC<BaseDrawerProps<void>> = () => {
  return (
    <DrawerLayout title="Об открытиях">
      <div className={s.body}>
        <section className={s.section}>
          <Heading role="title" as="h3">Разборы</Heading>
          <Text role="body">
            Разбор — это взгляд ИИ на твои записи за период: он читает съеденное и
            события и коротко описывает, что заметно и какие связи прослеживаются.
            Разбор недели охватывает от 7 до 35 дней; разбор дня смотрит только на
            один выбранный день.
          </Text>
        </section>

        <section className={s.section}>
          <Heading role="title" as="h3">Инсайты</Heading>
          <Text role="body">
            Инсайт — вывод «про тебя», к которому пришёл разбор: например, что
            какая-то еда совпадает с самочувствием. Понравившийся инсайт можно
            сохранить к себе — он останется на странице открытий.
          </Text>
        </section>

        <section className={s.section}>
          <Heading role="title" as="h3">Гипотезы</Heading>
          <Text role="body">
            Гипотеза — предположение, которое хочется проверить со временем. Можно
            завести свою или взять предложенную разбором, а дальше наблюдать,
            подтверждается ли она.
          </Text>
        </section>

        <section className={s.section}>
          <Heading role="title" as="h3">Открытия</Heading>
          <Text role="body">
            Открытия — твоя копилка: сохранённые инсайты и гипотезы в одном месте.
            Туда стоит заглядывать, чтобы видеть картину целиком, а не один разбор.
          </Text>
        </section>
      </div>
    </DrawerLayout>
  );
};

export default AboutDiscoveriesDrawer;
