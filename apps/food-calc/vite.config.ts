/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr';
import path from 'path';
import { patchCssModules } from 'vite-css-modules';
import checker from 'vite-plugin-checker';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { livestoreDevtoolsPlugin } from '@livestore/devtools-vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // basicSsl(),
    // VitePWA({
    //   registerType: 'autoUpdate',

    //   includeAssets: [
    //     'favicon.ico',
    //     'robots.txt',
    //     'apple-touch-icon.png'
    //   ],

    //   manifest: {
    //     name: 'My React PWA',
    //     short_name: 'ReactPWA',
    //     description: 'React + Vite Progressive Web App',
    //     theme_color: '#1976d2',
    //     background_color: '#ffffff',
    //     display: 'standalone',
    //     start_url: '/',
    //     icons: [
    //       {
    //         src: '/pwa-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png'
    //       },
    //       {
    //         src: '/pwa-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png'
    //       }
    //     ]
    //   }
    // }),
    patchCssModules(),
    svgr({
      // svgr options: https://react-svgr.com/docs/options/
      svgrOptions: { exportType: "default", ref: true, svgo: false, titleProp: true },
      include: "**/*.svg",
    }),
    checker({
      typescript: {
        tsconfigPath: 'tsconfig.json',
      },
      overlay: false,
      terminal: false,
    }),
    livestoreDevtoolsPlugin({ schemaPath: './src/livestore/schema.ts' }),
  ],
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  resolve: {
    alias: {
      '@icons': path.resolve(__dirname, './src/shared/assets/icons'),
      '@': path.resolve(__dirname, './src'),
      '@api': path.resolve(__dirname, '../../packages/api/src'),
      '@triplit-schema': path.resolve(__dirname, '../disher-backend-3.0/triplit')
      // '@store': '/src/store',
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
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    hmr: {
      overlay: false,
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        // Разделение вендорных библиотек (React, ReactDOM) для лучшего кеширования
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
        },
      },
    },
  }
})

// generateScopedName: process.env.NODE_ENV === 'production'
//   ? '[hash:base64:6]'
//   : '[name]__[local]___[hash:base64:5]'