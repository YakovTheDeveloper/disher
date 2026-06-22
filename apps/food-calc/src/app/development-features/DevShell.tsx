import { Outlet } from 'react-router-dom';

// Standalone dev-обвязка для страниц-«предложек» (роуты /suggestion_<id>).
// Намеренно НЕ внутри <App>: минует AuthGate (логин) и BackupGate (sync на
// маунте), чтобы ссылка открывалась всегда, даже на свежей сессии. Тащит только
// то, что нужно компонентам для верного вида: глобальный CSS, шрифты и app-тон.
// App-тон (--field/card/chip/list-* токены) публикуется БЕЗУСЛОВНО на `:root`
// (ModalShell.module.scss) — никакого JS-сеттера атрибута больше нет (бывший
// `data-modal-fields` снят 2026-06-22). Токены доезжают, пока ModalShell.module
// в бандле (превью-компоненты его импортируют).
import '../fonts';
import '@/shared/assets/style/index.scss';
import s from './SuggestionLayout.module.scss';

export default function DevShell() {
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
