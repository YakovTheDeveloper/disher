import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import path from 'path';

export default defineConfig([
    js.configs.recommended,
    ...tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    {
        languageOptions: {
            parserOptions: {
                project: ['./tsconfig.json'], // ✅ link to your TS config
                tsconfigRootDir: path.resolve(), // ✅ ensures absolute path
            },
        },
        rules: {
            'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
            'react/react-in-jsx-scope': 'off',
            "react/prop-types": "off",
            'no-console': ['error', { allow: ['warn', 'error'] }],
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
            ],
        },
    },
]);
