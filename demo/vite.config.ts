import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'chipper/styles.css': resolve(__dirname, '../src/styles/chipper.css'),
      'chipper': resolve(__dirname, '../src/index.ts'),
    },
  },
});
