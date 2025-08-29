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
            'react/react-in-jsx-scope': 'off'
        },
    },
]);
