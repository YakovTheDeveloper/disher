import { useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
} from '@floating-ui/react';
import { useLongPress } from '@/shared/lib/hooks/useLongPress';
import { Text } from '@/shared/ui/atoms/Typography';
import { WALLPAPER_SCREENS, type WallpaperScreen } from '@/shared/lib/wallpaper';
import { WallpaperStrip } from './WallpaperStrip';
import styles from './WallpaperHero.module.scss';

const screenLabel = (screen: WallpaperScreen) =>
  WALLPAPER_SCREENS.find((s) => s.key === screen)?.label ?? '';

/**
 * WallpaperHero — переиспользуемый слой поверх ЛЮБОЙ hero-обложки: долгий тап
 * (useLongPress, канон 450ms) открывает floating-поповер с лентой обоев этого
 * экрана (WallpaperStrip — тот же атом, что в настройках). Второй вход к тому же
 * выбору, прямо на месте; лист-контент под обложкой сразу показывает результат.
 *
 * Рендерит невидимый `.hit` (pointer-events:auto, покрывает обложку) — на нём
 * висит жест; короткий тап/свайп проходит насквозь к Embla (жест канона
 * отпускает pointer-capture на сдвиге >10px). Родитель-обложка держит
 * `pointer-events:none`, поэтому `.hit` — единственная интерактивная зона.
 * Поповер не авто-закрывается по выбору — можно перебрать несколько; закрытие
 * по тапу вне / Esc (useDismiss).
 */
export const WallpaperHero = ({ screen }: { screen: WallpaperScreen }) => {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'bottom',
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
  });

  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'dialog' });
  const { getFloatingProps } = useInteractions([dismiss, role]);

  const longPress = useLongPress(() => setOpen(true));

  return (
    <>
      <div
        ref={refs.setReference}
        className={styles.hit}
        aria-hidden="true"
        {...longPress}
      />
      {open && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className={styles.popover}
              {...getFloatingProps()}
            >
              <Text as="span" role="label" className={styles.title}>
                Обои · {screenLabel(screen)}
              </Text>
              <WallpaperStrip screen={screen} />
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
};

export default WallpaperHero;
