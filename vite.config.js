// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'assets': path.resolve(__dirname, 'src/assets'),
      'components': path.resolve(__dirname, 'src/components'),
      'pages': path.resolve(__dirname, 'src/pages'),
      'routes': path.resolve(__dirname, 'src/routes'),
      'services': path.resolve(__dirname, 'src/services'),
    }
  },
  build: {
    // Split big, rarely-changing vendors into their own chunks so they download
    // in parallel and stay cached across app deploys (faster repeat visits).
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          leaflet: ['leaflet', 'react-leaflet'],
          datetime: ['moment', 'date-fns', 'adhan'],
          // react-select + react-datepicker are NOT here on purpose: they're used
          // only inside the filter sheet, which is lazy-loaded (see swalPopup/index),
          // so they split into their own on-demand chunk off the initial path.
          ui: ['sweetalert2', 'sweetalert2-react-content'],
        },
      },
    },
  },
});
