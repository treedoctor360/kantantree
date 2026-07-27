import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages（https://<user>.github.io/kantantree/）で動かすため base を固定する
export default defineConfig({
  base: '/kantantree/',
  plugins: [react()],
});
