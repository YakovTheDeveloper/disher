/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import { patchCssModules } from 'vite-css-modules';
import checker from 'vite-plugin-checker';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync, existsSync } from 'fs';

const pkg = JSON.parse(
  readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')
) as { version: string };

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
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