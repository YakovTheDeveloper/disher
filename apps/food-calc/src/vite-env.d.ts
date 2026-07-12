/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-svgr/client" />

// Build-штамп (define в vite.config.ts): короткий git SHA (+dirty) и ISO-время сборки.
declare const __BUILD_ID__: string;
declare const __BUILT_AT__: string;
// `*.svg?react` → React component (vite-plugin-svgr typing).
// `*.svg`      → URL string (vite/client typing). Используется для src="…".