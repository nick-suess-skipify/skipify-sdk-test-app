import { resolve } from 'path';
import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  publicDir: './public',
  plugins: [cssInjectedByJsPlugin()],
  resolve: {
    alias: {
      '@checkout-sdk/shared/lib/constants': resolve(__dirname, '../shared/src/lib/constants.ts'),
      '@checkout-sdk/shared/lib/styles': resolve(__dirname, '../shared/src/lib/styles/index.css'),
      '@checkout-sdk/shared/lib/utils/iframe': resolve(__dirname, '../shared/src/lib/utils/iframe.ts'),
      '@checkout-sdk/shared': resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  build: {
    assetsDir: './',
    minify: true,
    lib: {
      entry: 'src/index.ts',
      formats: ['iife'],
      name: 'custom',
    },
    rollupOptions: {
      treeshake: false,
      external: [],
    },
  },
});
