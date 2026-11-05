import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { assetsInlineLimit: 0 }, // mantém os PNGs como arquivos
  test: { environment: 'node' },
});
