import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      // svgr options: https://react-svgr.com/docs/options/
      svgrOptions: { exportType: "default", ref: true, svgo: false, titleProp: true },
      include: "**/*.svg",
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
      '@store': '/src/store',
    },
  },
  server: {
    open: true,
    host: true,
    port: 3000, // This is the port which we will use in docker
    // add the next lines if you're using windows and hot reload doesn't work
    watch: {
      usePolling: true,
    },
  }
})