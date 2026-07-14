import { AuthForm } from './AuthForm';
import { CheckInboxView } from './CheckInboxView';
import { useAuthStore } from './auth-store';
import { useKeyboardAwareScroll } from '@/shared/ui/hooks/useKeyboardAwareScroll';
import { WALLPAPER_BY_ID } from '@/shared/lib/wallpaper';
import styles from './AuthScreen.module.scss';

/**
 * Fullscreen auth blocker. Mounted by AuthGate when there is no session.
 * On success the auth-store flips isLoggedIn → true and the gate unmounts.
 *
 * Облик — язык HomePage: hero-обложка («Городская площадь») прибита к верхней кромке
 * и тает в фон тем же easing-scrim'ом, что у HomeHero (вертикальный фейд + боковой
 * + верх во всю ширину), с белым масочным лого по центру. Снизу самокат-листом
 * поднимается СВЕТЛАЯ подложка (surface-2) — радиус листа + парная тень
 * elevation-2 — и несёт форму. База экрана — тёплая бумага (surface-0), в неё
 * растворяется низ обложки до того, как её накроет белый лист.
 */
export function AuthScreen() {
  // Inert while auth is Telegram-only (2026-07-13): nothing calls signUp, so
  // pendingVerificationEmail can no longer be set. Branch kept wired for the
  // day AuthForm's email flow is uncommented back in.
  const pendingEmail = useAuthStore((s) => s.pendingVerificationEmail);
  // Держит сфокусированный инпут над экранной клавиатурой (iOS). CSS-контракт —
  // в `.screen`: единственный скроллер (`overflow-y: auto`) + `padding-bottom:
  // var(--kb)`. Подробности и обоснование — в самом хуке.
  const scrollerRef = useKeyboardAwareScroll<HTMLDivElement>();

  return (
    <div className={styles.screen} ref={scrollerRef}>
      <div className={styles.hero} aria-hidden="true">
        {/* LCP холодного старта: AuthGate рендерит этот экран КАЖДОМУ незалогиненному.
            fetchpriority на самом <img>, а не <link rel=preload> в index.html — preload
            качал бы обложку и залогиненным, которые AuthScreen никогда не видят.
            Бывший hero-auth.jpg был байт-в-байт дублем «Городской площади». */}
        <img
          className={styles.heroImg}
          src={WALLPAPER_BY_ID.square.src}
          alt=""
          fetchPriority="high"
        />
        <div className={styles.logo} />
      </div>

      <div className={styles.sheet}>
        {pendingEmail ? (
          <CheckInboxView email={pendingEmail} layout="card" />
        ) : (
          <AuthForm layout="card" />
        )}
      </div>
    </div>
  );
}
