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
// Счётчик подряд идущих провалов установки и отметка последнего самолечения.
const FAILED_INSTALLS_KEY = 'disher.sw.failedInstalls';
const LAST_HEAL_KEY = 'disher.sw.lastHeal';

// Три провала — уже не «моргнула сеть», а систематика. Лечим не чаще раза в сутки:
// самолечение стирает ВСЕ кеши, то есть съедает офлайн — цена не для каждого сбоя.
const HEAL_AFTER_FAILURES = 3;
const HEAL_COOLDOWN_MS = 24 * 60 * 60 * 1000;

// localStorage в приватном режиме / при отключённых cookies КИДАЕТ (SecurityError)
// — прямо внутри statechange-листенера. Деградация без хранилища безопасна:
// счётчик провалов не копится (каждый провал выглядит «первым») → до самолечения
// просто не дойдёт, и петля reload'ов невозможна.
const readInt = (key: string): number => {
  try {
    return Number(localStorage.getItem(key) ?? 0) || 0;
  } catch {
    return 0;
  }
};

const writeKey = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* см. readInt: живём без персиста */
  }
};

const removeKey = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* см. readInt */
  }
};

// Lifecycle-логи SW — единственный способ отладить обновление PWA на телефоне
// (chrome://inspect): без них «не обновилось» неотличимо от «не проверялось».
// Штатные переходы — не warning'и, поэтому info (санкционированный обход no-console).
const swLog = (message: string): void => {
  console.info(message); // eslint-disable-line no-console
};

// Единственный документированный выход из «install → redundant» (workbox#1312):
// снять регистрацию, снести кеши, перезагрузиться. Иначе браузер бесконечно
// пробует поставить тот же SW, а юзер до конца времён сидит на старой ревизии.
// Один reload, под кулдауном — молчаливая петля перезагрузок на телефоне хуже
// любой залипшей сборки.
async function healWedgedServiceWorker(): Promise<void> {
  if (Date.now() - readInt(LAST_HEAL_KEY) < HEAL_COOLDOWN_MS) {
    console.warn('[disher:sw] heal пропущен — кулдаун 24ч ещё не вышел');
    return;
  }
  console.warn('[disher:sw] heal: unregister + снос кешей + reload');
  writeKey(LAST_HEAL_KEY, String(Date.now()));
  removeKey(FAILED_INSTALLS_KEY);

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((r) => r.unregister()));
  const cacheKeys = await caches.keys();
  await Promise.all(cacheKeys.map((k) => caches.delete(k)));
  window.location.reload();
}

// Провал установки наблюдаем только так: воркер уходит installing → redundant,
// МИНУЯ 'installed'. Причину спека не отдаёт (w3c/ServiceWorker#1247), поэтому
// ловим сам факт. Воркер надо держать за ссылку из updatefound: к моменту
// statechange `registration.installing` уже может быть null.
function watchInstallFailures(registration: ServiceWorkerRegistration): void {
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    if (!worker) return;
    swLog('[disher:sw] updatefound: ставится новая ревизия');

    let reachedInstalled = false;
    worker.addEventListener('statechange', () => {
      swLog(`[disher:sw] state → ${worker.state}`);
      if (worker.state === 'installed') reachedInstalled = true;
      if (worker.state === 'activated') {
        removeKey(FAILED_INSTALLS_KEY);
        return;
      }
      if (worker.state !== 'redundant' || reachedInstalled) return;

      const failures = readInt(FAILED_INSTALLS_KEY) + 1;
      console.warn(`[disher:sw] установка провалилась (${failures}/${HEAL_AFTER_FAILURES})`);
      writeKey(FAILED_INSTALLS_KEY, String(failures));
      if (failures < HEAL_AFTER_FAILURES) return;

      // Само лечение не должно ронять приложение: не вышло — живём как жили.
      // eslint-disable-next-line no-restricted-syntax
      void healWedgedServiceWorker().catch(() => {});
    });
  });
}

export function installPwaAutoUpdate(): void {
  registerSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;

      watchInstallFailures(registration);

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
