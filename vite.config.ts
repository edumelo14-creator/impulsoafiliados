import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { interbaseProxyPlugin } from './vite-plugin-interbase';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), interbaseProxyPlugin()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
