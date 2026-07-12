import { registerSW } from 'virtual:pwa-register';

// Деплой редкий — чаще раза в час опрашивать сервер незачем.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

// Возврат в приложение и восстановление сети могут прийти пачкой (Android шлёт
// visibilitychange + online подряд). Не дёргаем сеть чаще раза в минуту.
const MIN_CHECK_GAP_MS = 60 * 1000;

// Почему регистрация SW живёт здесь, а не на автоинжекте плагина.
//
// Без импорта `virtual:pwa-register` vite-plugin-pwa при `injectRegister: 'auto'`
// подставляет голый registerSW.js — он делает ровно `navigator.serviceWorker
// .register()`. Новый SW при этом устанавливается, а `skipWaiting` +
// `clientsClaim` (их плагин включает сам под registerType:'autoUpdate') отдают ему
// управление страницей немедленно. Но перезагрузить УЖЕ ОТРИСОВАННЫЙ документ
// некому — он остаётся на старых чанках, которых после `cleanupOutdatedCaches`
// нет ни в кеше, ни на сервере (деплой подменяет каталог целиком). Это ровно тот
// сценарий, от которого предостерегает Workbox: не «старая сборка», а сборка,
// у которой ленивый импорт падает. Импорт виртуального модуля переводит
// регистрацию на workbox-window, и тот на `activated` делает location.reload() —
// окно рассинхрона схлопывается в ноль.
//
// Второе звено — сами проверки. Браузер сверяет sw.js только при НАВИГАЦИИ, а
// возврат в свёрнутое Android-PWA навигацией не является: документ восстанавливают
// живьём, проверка не запускается, сборка висит старая. Поэтому дёргаем update()
// руками — на возврате видимости, на восстановлении сети и по таймеру.
export function installPwaAutoUpdate(): void {
  registerSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;

      let lastCheckAt = 0;

      const checkForUpdate = async () => {
        if (registration.installing || !navigator.onLine) return;
        if (Date.now() - lastCheckAt < MIN_CHECK_GAP_MS) return;
        lastCheckAt = Date.now();

        // Пробный запрос перед update(): update() на недоступном сервере
        // (кафе-Wi-Fi с капатив-порталом отвечает 200-заглушкой, туннель отдаёт
        // 5xx) — лишний повод для брошенной регистрации. Ходим только на живой
        // sw.js. `no-store` — чтобы не спросить у HTTP-кеша его же копию.
        const resp = await fetch(swUrl, {
          cache: 'no-store',
          headers: { cache: 'no-store', 'cache-control': 'no-cache' },
        });
        if (resp.status === 200) await registration.update();
      };

      // Сеть — вещь ненадёжная по определению; провалившаяся проверка не стоит
      // ни тоста, ни записи в Sentry: следующий resume/тик повторит.
      const check = () => {
        // eslint-disable-next-line no-restricted-syntax
        void checkForUpdate().catch(() => {});
      };

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
      window.addEventListener('online', check);
      setInterval(check, UPDATE_CHECK_INTERVAL_MS);
    },
  });
}
