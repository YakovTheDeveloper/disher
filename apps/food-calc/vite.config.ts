/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import { patchCssModules } from 'vite-css-modules';
import checker from 'vite-plugin-checker';
import { VitePWA } from 'vite-plugin-pwa';
import type { Plugin } from 'vite';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const pkg = JSON.parse(
  readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')
) as { version: string };

// Build-штамп: без него «PWA не обновилось» неотличимо от «обновилось, но UI
// похож». SHA — с машины сборки; суффикс +dirty честно помечает сборку из
// грязного дерева (одинаковый SHA ≠ одинаковый код). Вне git-чекаута не падаем.
const buildId = (() => {
  try {
    const sha = execSync('git rev-parse --short HEAD', { cwd: __dirname }).toString().trim();
    const dirty =
      execSync('git status --porcelain', { cwd: __dirname }).toString().trim() !== '';
    return dirty ? `${sha}+dirty` : sha;
  } catch {
    return 'nogit';
  }
})();
const builtAt = new Date().toISOString();

// version.json — честный ответ «что лежит на сервере»: в precache НЕ попадает
// (globPatterns без .json) → всегда с сети. deploy-spa.sh после свопа строго
// сверяет его с локальным dist/version.json.
const versionJson = (): Plugin => ({
  name: 'disher-version-json',
  apply: 'build',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: JSON.stringify({ buildId, builtAt }),
    });
  },
});

// open-in-editor целимся на CLI `code`, а не на автодетект.
//
// Vite дёргает `/__open-in-editor` через bundled `launch-editor`. На Windows его
// автодетект сканирует процессы, находит ЗАПУЩЕННЫЙ GUI-бинарь `Code.exe` и
// спавнит ИМЕННО его с `-r -g file:line:col` → GUI-exe так не умеет и выходит с
// `code 9` («Could not open … in the editor»). CLI-обёртка `code` (через шелл →
// `code.cmd`) эти аргументы понимает. `??=` оставляет приоритет за реальным env.
process.env.LAUNCH_EDITOR ??= 'code';

// Alt+Click → открыть .tsx-компонент в редакторе (dev-only удобство).
//
// Завендорено вместо npm `vite-plugin-react-click-to-component`: его 4.x требует
// vite ^7 и грузит клиент через виртуальный модуль на object-form filter-хуках
// `resolveId`/`load`, которых нет в нашем vite 6.3.7 → сломало бы резолв модулей.
// А 3.x на React 19.2.5 падал `ReferenceError: source is not defined`, потому что
// React 19.2 выкинул аргумент `source` из dev-рантайма. Берём ТУ ЖЕ заплатку из
// 4.x (дописывает `source` обратно в jsxDEVImpl/ReactElement/jsxDEV), но через
// классический `transform`-хук + инлайн-инъекцию клиента (механизм 3.x) — оба
// поддержаны на любой vite. Только `serve`, прод не трогает.
const reactClickToComponentLocal = (): Plugin => {
  let root = '';
  let base = '';
  let clientCode = '';
  return {
    name: 'react-click-to-component-local',
    apply: 'serve',
    configResolved(config) {
      root = config.root;
      base = config.base;
      clientCode = readFileSync(
        path.resolve(__dirname, 'vite-plugins/click-to-component.client.js'),
        'utf-8',
      );
    },
    configureServer(server) {
      // Shift+клик в меню → сюда прилетает путь .tsx. Ищем рядом одноимённый
      // стиль-файл (scss/css, модульный или нет) и редиректим на встроенный
      // /__open-in-editor — он и откроет редактор. Нет файла → 204 (тишина).
      server.middlewares.use('/__open-style', (req, res) => {
        const src = new URL(req.url ?? '', 'http://x').searchParams.get('file') ?? '';
        const tsx = src.replace(/:\d+(:\d+)?$/, ''); // срезать :line:col
        const dir = path.dirname(tsx);
        const stem = path.basename(tsx).replace(/\.(tsx|jsx|ts|js)$/i, '');
        const found = ['.module.scss', '.module.css', '.scss', '.css']
          .map((ext) => path.join(dir, stem + ext))
          .find((f) => existsSync(f));
        if (!found) {
          res.statusCode = 204;
          res.end();
          return;
        }
        res.statusCode = 302;
        res.setHeader(
          'Location',
          `${base}__open-in-editor?file=${encodeURIComponent(found + ':1:1')}`,
        );
        res.end();
      });
    },
    transform(code, id) {
      // Чиним dev-рантайм React: возвращаем `source` в jsxDEV, чтобы fiber нёс
      // `_debugInfo = {fileName,lineNumber,columnNumber}` для open-in-editor.
      if (!id.includes('jsx-dev-runtime.js')) return;
      if (code.includes('_source')) return;
      const defineIndex = code.indexOf('"_debugInfo"');
      if (defineIndex === -1) return;
      const valueIndex = code.indexOf('value: null', defineIndex);
      if (valueIndex === -1) return;
      let next =
        code.slice(0, valueIndex) + 'value: source' + code.slice(valueIndex + 11);
      // Старый рантайм уже имел параметр `source` — больше ничего не нужно.
      if (code.includes('function ReactElement(type, key, self, source,')) {
        return next;
      }
      // React 19.2: протягиваем `source` через списки параметров jsxDEVImpl /
      // ReactElement / публичного jsxDEV (он ловит 5-й арг, что Babel уже шлёт).
      next = next.replace(
        /maybeKey,\s*isStaticChildren/gu,
        'maybeKey, isStaticChildren, source',
      );
      next = next.replace(
        /(\w+)?,\s*debugStack,\s*debugTask/gu,
        (m, previousArg) =>
          previousArg === 'source' ? m : m.replace('debugTask', 'debugTask, source'),
      );
      return next;
    },
    transformIndexHtml() {
      // replaceAll, НЕ replace: плейсхолдеры встречаются и в комментарии клиента,
      // а replace заменил бы только первое (комментарийное) вхождение, оставив
      // боевые `var root/base` плейсхолдерами → fetch уходил бы в никуда.
      return [
        {
          tag: 'script',
          attrs: { type: 'module' },
          children: clientCode.replaceAll('__ROOT__', root).replaceAll('__BASE__', base),
        },
      ];
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
    __BUILD_ID__: JSON.stringify(buildId),
    __BUILT_AT__: JSON.stringify(builtAt),
  },
  plugins: [
    // React Compiler (авто-мемоизация, 1.0). Это Babel-плагин, поэтому ушли с
    // @vitejs/plugin-react-swc на Babel-вариант — теряем скорость SWC ради
    // авто-мемоизации (компилятор сам расставляет useMemo/useCallback/memo).
    // Откат: вернуть @vitejs/plugin-react-swc + `react()` без babel-опции.
    // Тест C (HMR-диагностика): `VITE_NO_COMPILER=1` отключает React Compiler,
    // чтобы проверить, не он ли виновник full-reload при правке .module.scss.
    // По умолчанию (без флага) компилятор включён как раньше.
    process.env.VITE_NO_COMPILER
      ? react()
      : react({
          babel: {
            plugins: [['babel-plugin-react-compiler', {}]],
          },
        }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Manifest lives in public/manifest.webmanifest — don't let the plugin
      // regenerate one; we own the source of truth.
      manifest: false,
      includeAssets: [
        'logo.svg',
        'logo-maskable.svg',
        'icon-192.png',
        'icon-512.png',
        'icon-512-maskable.png',
        'apple-touch-icon.png',
        // Гравюра boot-splash (index.html) + Suspense-фолбэка (момент 4) + лого-маска
        // поверх неё. Точечное исключение из «картинки не прекешим» (см. workbox ниже):
        // оба рисуются на КАЖДОМ холодном старте, поэтому должны быть в кеше сразу и
        // офлайн — как PWA-иконки. Каталожные миниатюры/обои остаются в runtimeCaching.
        'art/loader-analysis.png',
        'logo/logo-white-no-fill.png',
      ],
      workbox: {
        // Картинки НЕ прекешим: 396 миниатюр каталога + обои тянулись бы при install
        // (542 записи / 18 MB), конкурируя за канал с первым рендером. Они уходят в
        // runtimeCaching ниже — кешируются по факту показа. PWA-иконки не теряются:
        // они приходят через includeAssets, а не через globPatterns.
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // wa-sqlite + powersync ship large wasm/worker bundles that we don't
        // want eagerly precached; they're loaded on demand.
        globIgnores: ['**/wa-sqlite*', '**/powersync*', '**/sql-wasm*'],
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          // iOS 18 standalone-PWA: fetch с телом (POST/PUT/DELETE), который SW
          // пропускает «насквозь» (нет respondWith), зависает внутри WebKit и
          // умирает в `TypeError: Load failed`, НЕ выходя в сеть — логин из
          // установленной PWA не работал вообще (nginx-логи 2026-07-18: от PWA
          // доходят только GET; ни OPTIONS, ни POST). В Safari-вкладке тот же
          // код работает. Воркэраунд: явный NetworkOnly-маршрут на не-GET к
          // /api/ — SW отвечает respondWith(fetch(request)), этот путь багу не
          // подвержен. Семантика не меняется (NetworkOnly = сеть без кеша).
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
            method: 'POST',
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
            method: 'PUT',
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
            method: 'DELETE',
          },
          {
            // Миниатюры каталога, обои, гравюры, hero. CacheFirst: скачалось один
            // раз при показе, дальше из кеша без похода в сеть. Заодно закрывает
            // старую дыру — jpg/jfif в globPatterns не входили вообще, обои офлайн
            // не работали никогда.
            //
            // ⚠️ ИНВАРИАНТ РЕВИЗИЙ. Картинки лежат в public/ → их имена НЕ несут
            // контент-хеша (`/catalog-food/<id>.webp` завязан на стабильный id).
            // Пока они прекешились, версии вёл Workbox — по хешу в манифесте.
            // Теперь этого механизма нет: CacheFirst на нехешированном имени не
            // умеет инвалидацию в принципе.
            //
            // Поэтому: ПОМЕНЯЛ СОДЕРЖИМОЕ КАРТИНКИ ПРИ ТОМ ЖЕ ИМЕНИ — бампни
            // `disher-images-v1` → `-v2` в ТОМ ЖЕ коммите. Иначе тот, кто её уже
            // видел, будет год смотреть старую. Каталожные фото правятся живьём
            // (396/406), так что путь не гипотетический. Бамп дропает старый бакет;
            // юзер дотянет заново только то, что реально открывает.
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'disher-images-v1',
              expiration: {
                // В dist сейчас 457 картинок (396 каталог + 36 обоев/миниатюр +
                // 15 гравюр + логотипы). Запас на рост каталога: на пересечении
                // порога ExpirationPlugin молча выбивает по LRU, и юзер начинает
                // перекачивать уже виденное — ровно то, от чего мы уходили.
                maxEntries: 800,
                maxAgeSeconds: 60 * 60 * 24 * 365,
                purgeOnQuotaError: true,
              },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
    versionJson(),
    patchCssModules(),
    reactClickToComponentLocal(),
    svgr({
      // svgr options: https://react-svgr.com/docs/options/
      svgrOptions: { exportType: "default", ref: true, svgo: false, titleProp: true },
      // `?react` suffix — industry 2026 split: `from '...svg'` → URL string
      // (vite/client typing), `from '...svg?react'` → React component (svgr
      // typing с полными SVGProps). Без split TS-типизация конфликтует с
      // vite/client `declare module '*.svg' { const src: string }` и теряет
      // props на JSX callsite.
      include: "**/*.svg?react",
    }),
    // Прод-деплой (scripts/deploy-spa.sh --no-typecheck) должен уметь выкатить
    // фронт, когда type-гейт красный от НЕ-прод кода (тест-фикстуры, dev-предложки):
    // esbuild всё равно стрипает типы без проверки, эмит от этого не меняется.
    // Это осознанный escape hatch, а не «выключили проверку»: по умолчанию гейт жив.
    ...(process.env.SKIP_TYPECHECK
      ? []
      : [
          checker({
            typescript: {
              tsconfigPath: 'tsconfig.json',
            },
            overlay: false,
            terminal: false,
          }),
        ]),
  ],
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@powersync/web', '@journeyapps/wa-sqlite'],
  },
  resolve: {
    alias: {
      '@icons': path.resolve(__dirname, './src/shared/assets/icons'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    modules: {
      // generateScopedName: customScopedName,
      generateScopedName: '[folder]-[local]__[hash:base64:5]',
    },
    devSourcemap: true
  },
  worker: {
    format: 'es',
  },
  server: {
    host: process.env.VITE_E2E_HTTP ? '127.0.0.1' : undefined,
    headers: process.env.VITE_E2E_HTTP
      ? undefined
      : {
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp',
        },
    hmr: {
      overlay: false,
    },
    https: (() => {
      if (process.env.VITE_E2E_HTTP) return undefined;
      const certPath = path.resolve(__dirname, '../disher-backend-3.0/certs');
      const certFile = path.join(certPath, 'localhost-cert.pem');
      const keyFile = path.join(certPath, 'localhost-key.pem');
      if (existsSync(certFile) && existsSync(keyFile)) {
        return {
          cert: readFileSync(certFile),
          key: readFileSync(keyFile),
        };
      }
      return undefined;
    })(),
    // Proxy diag-logs through the dev server so iOS Safari doesn't have to
    // accept the self-signed cert on :3100 separately.
    //
    // CRITICAL: a defined `server.proxy` forces Vite's dev server down to
    // HTTP/1.1 (see Vite `resolveHttpServer`, "#484 fallback to http1 when
    // proxy is needed"). With `https` and NO proxy, Vite serves over HTTP/2.
    // On a real mobile device over Wi-Fi, HTTP/1.1's 6-connection limit turns
    // the hundreds of unbundled dev-module requests into a multi-minute
    // cascade. So the proxy is gated behind VITE_DIAG: normal dev gets HTTP/2;
    // a diag session (VITE_DIAG=1) opts back into the proxy + HTTP/1.1.
    // Must be `undefined` (not `{}`) when off — an empty object is truthy and
    // would still trip the HTTP/1.1 fallback.
    proxy:
      process.env.VITE_DIAG === '1'
        ? {
            '/api/diag-logs': {
              target: 'https://localhost:3100',
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        // Вендоры бьём на кешируемые чанки, а каталог (~244 КБ JSON) выносим из
        // главного бандла: раньше ВСЁ (либы + все экраны + каталог) лежало в одном
        // 2.5 МБ чанке, который iOS Safari парсил секундами до первого кадра.
        // React+ReactDOM держим ОДНИМ чанком — их разрыв ломает порядок инициализации.
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            if (id.includes('/shared/data/catalog')) return 'catalog';
            return undefined; // app-код: экраны уезжают в свои чанки через route-level lazy
          }
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
          if (id.includes('@base-ui') || id.includes('@floating-ui')) return 'vendor-baseui';
          if (id.includes('motion')) return 'vendor-motion';
          if (id.includes('dexie')) return 'vendor-dexie';
          if (id.includes('@sentry')) return 'vendor-sentry';
          if (id.includes('embla')) return 'vendor-embla';
          if (id.includes('better-auth') || id.includes('better-call') || id.includes('nanostores'))
            return 'vendor-auth';
          if (id.includes('i18next')) return 'vendor-i18n';
          if (
            id.includes('react-markdown') ||
            id.includes('remark') ||
            id.includes('micromark') ||
            id.includes('mdast') ||
            id.includes('hast') ||
            id.includes('unified') ||
            id.includes('unist') ||
            id.includes('vfile') ||
            id.includes('property-information') ||
            id.includes('decode-named-character-reference')
          )
            return 'vendor-markdown';
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('date-fns')) return 'vendor-datefns';
          if (id.includes('fuse')) return 'vendor-fuse';
          if (id.includes('react-day-picker')) return 'vendor-daypicker';
          return 'vendor';
        },
      },
    },
  }
})

// generateScopedName: process.env.NODE_ENV === 'production'
//   ? '[hash:base64:6]'
//   : '[name]__[local]___[hash:base64:5]'