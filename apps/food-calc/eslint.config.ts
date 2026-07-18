import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import path from 'path';

export default defineConfig([
    // ESLint 9 ignores only node_modules/.git by default — it does NOT read
    // .gitignore, so build output got linted as if it were source (dist/sw.js,
    // the minified vendor bundles). `--ext ts,tsx` in the lint script looked like
    // it scoped this, but --ext is a no-op under flat config (verified: `--ext qqq`
    // still scanned 876 files) — scope belongs here, not on the CLI.
    // `__fixtures__` carry deliberately-bad code (the design-tooling detector's
    // known-bad / codemod input cases); stylelint already exempts them for the
    // same reason.
    globalIgnores([
        'dist/**',
        'dist-ssr/**',
        'dev-dist/**',
        'coverage/**',
        'playwright-report/**',
        'test-results/**',
        '**/__fixtures__/**',
        'vite.config.d.ts',
    ]),
    js.configs.recommended,
    ...tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    // React Compiler линт: набор granular-правил (purity / set-state-in-render /
    // immutability / refs / static-components / use-memo …), которые ловят код,
    // мешающий компилятору безопасно мемоизировать (он молча «бейлит» такие
    // компоненты). rules-of-hooks тоже здесь. Подключён вместе с включённым
    // React Compiler (см. [[project_react_compiler_2026_06_06]]).
    {
        // recommended-latest в v7 — legacy eslintrc-формат (plugins массивом),
        // поэтому регистрируем плагин объектом сами и тянем severity-набор из
        // пресета. exhaustive-deps + ещё два правила там `warn`, а у нас
        // `--max-warnings 0` (warn = провал гейта); exhaustive-deps с включённым
        // компилятором избыточен и шумит на легаси — глушим в off, оставляя
        // только error-level compiler-rules.
        plugins: { 'react-hooks': reactHooks },
        rules: {
            ...reactHooks.configs['recommended-latest'].rules,
            'react-hooks/exhaustive-deps': 'off',
            'react-hooks/incompatible-library': 'off',
            'react-hooks/unsupported-syntax': 'off',
            // set-state-in-effect намеренно off: все срабатывания в кодовой базе
            // на легитимных паттернах (async-fetch в polling-хуках, reset/sync
            // state при смене пропа когда не редактируем, optimistic-pending
            // против мелькания). Это не баги; остальные ~12 compiler-rules
            // (rules-of-hooks, purity, refs, set-state-in-render, immutability,
            // preserve-manual-memoization…) остаются строгими. Решение 2026-06-06.
            'react-hooks/set-state-in-effect': 'off',
        },
    },
    {
        // react-hooks/refs ложно срабатывает на floating-ui `useFloating().refs`
        // (setReference/setFloating — это ref-сеттеры библиотеки, не React-ref-
        // доступ в рендере) и на createElement ref-forward в ChangeHighlight
        // (hostRef — обычный ref, .current читается только в эффектах). Правило
        // флагует место `ref={...}` в JSX, куда inline-disable не поставить —
        // поэтому точечный off на эти файлы. Latest-ref паттерны в других местах
        // остаются под правилом (их чинили переносом записи ref в эффект).
        files: [
            'src/shared/ui/popover/PopoverTrigger/PopoverTrigger.tsx',
            'src/features/wallpaper/WallpaperHero.tsx',
            'src/shared/ui/ChangeHighlight/ChangeHighlight.tsx',
        ],
        rules: {
            'react-hooks/refs': 'off',
        },
    },
    {
        languageOptions: {
            parserOptions: {
                // All three projects, or the parser rejects every file the listed ones
                // don't include. tsconfig.json covers src only — so the e2e specs and
                // the tooling scripts failed to parse and thus skipped every rule.
                project: ['./tsconfig.json', './tsconfig.test.json', './tsconfig.node.json'],
                tsconfigRootDir: path.resolve(), // ✅ ensures absolute path
            },
        },
        rules: {
            'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
            'react/react-in-jsx-scope': 'off',
            "react/prop-types": "off",
            'no-console': ['error', { allow: ['warn', 'error'] }],
            // skipComments: a doc comment that shows `{/* … */}` as example syntax
            // has to break the literal `*/`, or it terminates its own block — and a
            // zero-width space is the only way to do that (comments have no escape
            // sequences). See design-primitives/lib.mjs:87. Invisible chars in CODE
            // still error, which is where the rule earns its keep.
            'no-irregular-whitespace': ['error', { skipComments: true }],
            // `_`-prefix = "unused on purpose": a param kept because the signature
            // requires it (a callback's later arg, a documented shape). Without an
            // opt-out the only way to silence those is deleting the name, which
            // loses what it documented.
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
            ],
        },
    },
    // Node tooling: the design-token gate scripts, build/test configs, the
    // component generator. These run under Node, not in the browser, so they need
    // node globals — without them every `process`/`require`/`module` read is a
    // no-undef. (`no-undef` only fires on plain JS here: typescript-eslint's
    // recommended preset disables it for TS, where the compiler already checks.)
    // `no-console` is off because stdout IS these scripts' interface — a gate that
    // can't print its violations is useless.
    {
        files: [
            'scripts/**/*.{js,mjs,cjs,ts}',
            '*.config.{js,mjs,cjs,ts}',
            '.stylelintrc.cjs',
            'stylelint-legacy-baseline.cjs',
            'typo-encapsulation-baseline.cjs',
            'create-boilerplate-component.js',
            'vitest.setup.ts',
        ],
        languageOptions: {
            globals: globals.node,
        },
        rules: {
            'no-console': 'off',
            // .cjs files are CommonJS by definition; require() is the module system,
            // not a legacy import style to migrate off.
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
    // Vendored browser client injected into index.html (see vite.config.ts) — it
    // runs in the page, so it gets browser globals rather than node ones.
    //
    // Style rules are off: this is a verbatim copy of
    // vite-plugin-react-click-to-component@4.2.2's client.js, kept diffable against
    // upstream. Linting third-party code we don't author only creates pressure to
    // edit it, which is exactly what makes the next version bump painful.
    {
        files: ['vite-plugins/**/*.client.js'],
        languageOptions: {
            globals: globals.browser,
        },
        rules: {
            'no-console': 'off',
            'no-empty': 'off',
        },
    },
    // E2E specs: console output is the debugging channel when a Playwright run
    // fails in CI with no browser to open. They ship to no user.
    {
        files: ['tests/e2e/**/*.ts'],
        rules: {
            'no-console': 'off',
        },
    },
    // Dev «предложки» (see the /предложка skill): throwaway pages that exist to pick
    // a design by looking at it, on dev-only routes. no-unescaped-entities wants
    // `«»`/`"` spelled as HTML entities — a readability rule whose cost lands on
    // prose that is the whole point of these pages, and whose benefit (a stray quote
    // breaking JSX) never reaches a user here.
    {
        files: ['src/app/development-features/**/*.tsx'],
        rules: {
            'react/no-unescaped-entities': 'off',
        },
    },
    // Dexie write-contract enforcement (merge-sync). Every domain write must go
    // through shared/lib/dexie/write.ts so updated_at is stamped and deletes
    // record a tombstone in the same rw-tx. Whitelisted: write.ts itself, the
    // snapshot merge()/apply() (they write incoming rows via db.table.put
    // DIRECTLY to preserve the foreign updated_at), and the schema migration.
    // Test files seed Dexie directly and are exempt.
    //
    // Residual gap (NOT statically catchable, by design — see fix_plan T1.8):
    // aliased handles (`const t = db.products; t.delete(id)`,
    // `db.tables.map(t => t.clear())`) and dynamic access
    // (`db.table(name).put(...)`, which merge() uses deliberately). Keep new
    // raw writes out of the aliased form.
    {
        files: ['src/**/*.{ts,tsx}'],
        ignores: [
            'src/shared/lib/dexie/write.ts',
            'src/shared/lib/snapshot/index.ts',
            'src/shared/lib/dexie/schema.ts',
            'src/**/*.test.ts',
            'src/**/*.test.tsx',
            'src/**/__tests__/**',
        ],
        rules: {
            'no-restricted-syntax': [
                'error',
                {
                    selector:
                        "CallExpression[callee.object.object.name='db'][callee.property.name=/^(add|put|update|delete|bulkAdd|bulkPut|bulkDelete)$/]",
                    message:
                        'Raw Dexie write (db.<table>.add/put/update/delete/bulk*). Use the write contract in @/shared/lib/dexie/write — putRow/putRows/updateRow/deleteRow/deleteRows. It stamps updated_at and tombstones deletes in one rw-tx.',
                },
                {
                    selector:
                        "CallExpression[callee.property.name='delete'][callee.object.type='CallExpression']",
                    message:
                        'Raw collection/filtered delete (.where(...)/.filter(...).delete()). Resolve ids first, then deleteRows() from @/shared/lib/dexie/write so each delete writes a tombstone.',
                },
                // "No silent failures" invariant (see safeMutate.ts doc-comment).
                // An empty `.catch(() => {})` swallows a rejected promise with no
                // user signal. Either surface it (toaster / reportError) OR, if
                // it is genuinely best-effort and cannot lose user data, annotate
                // the site with `// best-effort: <why no data loss>` and an
                // `// eslint-disable-next-line no-restricted-syntax` so every
                // swallow is deliberate and greppable.
                {
                    selector:
                        "CallExpression[callee.property.name='catch'] > ArrowFunctionExpression[body.type='BlockStatement'][body.body.length=0]",
                    message:
                        'Empty .catch(() => {}) swallows the error silently (no-silent-failures invariant). Surface it (toaster/reportError), or if genuinely best-effort with no data loss, annotate with `// best-effort: <why>` + `// eslint-disable-next-line no-restricted-syntax`.',
                },
            ],
        },
    },
]);
