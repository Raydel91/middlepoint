import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@middlepoint/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
});
