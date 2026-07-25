import { RoundButton } from '@/shared/ui/RoundButton';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import evTent from '@/shared/assets/icons/event-variants/ev-tent.svg';
import evSunrise from '@/shared/assets/icons/event-variants/ev-sunrise.svg';
import evStall from '@/shared/assets/icons/event-variants/ev-stall.svg';
import evMoon from '@/shared/assets/icons/event-variants/ev-moon.svg';
import evBelltower from '@/shared/assets/icons/event-variants/ev-belltower.svg';
import evBell from '@/shared/assets/icons/event-variants/ev-bell.svg';
import evLighthouseA from '@/shared/assets/icons/event-variants/ev-lighthouse-a.svg';
import evLighthouseB from '@/shared/assets/icons/event-variants/ev-lighthouse-b.svg';
import evLighthouseC from '@/shared/assets/icons/event-variants/ev-lighthouse-c.svg';
import evBoat from '@/shared/assets/icons/event-variants/ev-boat.svg';
import evBoatB from '@/shared/assets/icons/event-variants/ev-boat-b.svg';
import evBoatIso from '@/shared/assets/icons/event-variants/ev-boat-iso.svg';
import evMindBook from '@/shared/assets/icons/event-variants/ev-mind-book.svg';
import evMindWindow from '@/shared/assets/icons/event-variants/ev-mind-window.svg';
import evComet from '@/shared/assets/icons/event-variants/ev-comet.svg';
import evCometB from '@/shared/assets/icons/event-variants/ev-comet-b.svg';
import evCometC from '@/shared/assets/icons/event-variants/ev-comet-c.svg';
import evStargaze from '@/shared/assets/icons/event-variants/ev-stargaze.svg';
import evShooting from '@/shared/assets/icons/event-variants/ev-shooting.svg';
import evObservatory from '@/shared/assets/icons/event-variants/ev-observatory.svg';
import evFirework from '@/shared/assets/icons/event-variants/ev-firework.svg';
import { EVENT_CREATE_MAIN_INPUT_ID } from './EventCreateModal.constants';
import s from './AddEventMedal.module.scss';

// Варианты гравюры медали — переключаются из dev-DesignBar (ключ
// `AddEventMedalIcon`, выбор персистится в localStorage). Первый — дефолт.
// Эстетический канон серии: один крупный жирный силуэт, центрированная
// композиция, минимум прорезей, много воздуха. Мотивы: маяки (зум на фонарь,
// фонарная комната с лучом, сияние звездой), вайб дня (восход, луна,
// парусники), изо-дневник и изо-окно — события ума и события дня.
// Дуговая отсечка низа зашита в mask каждой гравюры — расчищает кольцо
// под подпись медали.
const EVENT_ICON_VARIANTS = [
  'tent',
  'sunrise',
  'stall',
  'moon',
  'belltower',
  'bell',
  'lighthouse-a',
  'lighthouse-b',
  'lighthouse-c',
  'boat',
  'boat-b',
  'boat-iso',
  'mind-book',
  'mind-window',
  'comet',
  'comet-b',
  'comet-c',
  'stargaze',
  'shooting',
  'observatory',
  'firework',
] as const;

type EventIconVariant = (typeof EVENT_ICON_VARIANTS)[number];

const EVENT_ICONS: Record<EventIconVariant, string> = {
  tent: evTent,
  sunrise: evSunrise,
  stall: evStall,
  moon: evMoon,
  belltower: evBelltower,
  bell: evBell,
  'lighthouse-a': evLighthouseA,
  'lighthouse-b': evLighthouseB,
  'lighthouse-c': evLighthouseC,
  boat: evBoat,
  'boat-b': evBoatB,
  'boat-iso': evBoatIso,
  'mind-book': evMindBook,
  'mind-window': evMindWindow,
  comet: evComet,
  'comet-b': evCometB,
  'comet-c': evCometC,
  stargaze: evStargaze,
  shooting: evShooting,
  observatory: evObservatory,
  firework: evFirework,
};

/**
 * Медаль «Новое событие» в trailingSlot бара событий — вход в ОФЛАЙН-форму
 * (`ModalByLabel` через `htmlFor` → фокус `EVENT_CREATE_MAIN_INPUT_ID`). Облик =
 * elevated-монета «Новая еда»: тёмный диск + белая силуэт-гравюра с бейджем-плюсом
 * (event-variants/*.svg, единая система с add-food-icon.png), подпись на НИЖНЕЙ
 * дуге. Гравюра переключается из dev-DesignBar (см. EVENT_ICON_VARIANTS).
 */
export const AddEventMedal = () => {
  const { variant, anchor } = useDesignVariant('AddEventMedalIcon', EVENT_ICON_VARIANTS);

  return (
    <div className={s.wrap} {...anchor}>
      <RoundButton
        htmlFor={EVENT_CREATE_MAIN_INPUT_ID}
        ariaLabel="Новое событие"
        img={EVENT_ICONS[variant]}
        arcBottom="Новое событие"
        floating={false}
        look="elevated"
      />
    </div>
  );
};

export default AddEventMedal;
