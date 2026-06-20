import { useLayoutEffect } from 'react';
import { Outlet } from 'react-router-dom';

// Standalone dev-обвязка для страниц-«предложек» (роуты /suggestion_<id>).
// Намеренно НЕ внутри <App>: минует AuthGate (логин) и BackupGate (sync на
// маунте), чтобы ссылка открывалась всегда, даже на свежей сессии. Тащит только
// то, что нужно компонентам для верного вида: глобальный CSS, шрифты и app-тон
// (--field/card/chip/list-* токены через body[data-modal-fields]).
import '../fonts';
import '@/shared/assets/style/index.scss';
import s from './SuggestionLayout.module.scss';

// Один app-тон, как в App.tsx — иначе превью токен-driven поверхностей
// (background: var(--card-bg)) рисуется без палитры.
const APP_TONE = 'mono';

export default function DevShell() {
  useLayoutEffect(() => {
    const prev = document.body.getAttribute('data-modal-fields');
    document.body.setAttribute('data-modal-fields', APP_TONE);
    return () => {
      if (prev === null) document.body.removeAttribute('data-modal-fields');
      else document.body.setAttribute('data-modal-fields', prev);
    };
  }, []);

  // Глобальный index.scss держит body { display:flex; overflow:hidden } и
  // #root { height:100% } — у боевого App свои внутренние скролл-контейнеры.
  // Standalone-предложки своего скролла не имеют, поэтому контент выше экрана
  // обрезался. Даём шеллу полноэкранный скролл-контейнер — чинит ВСЕ предложки.
  return (
    <div className={s.devShell}>
      <Outlet />
    </div>
  );
}
