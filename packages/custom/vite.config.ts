import { resolve } from 'path';
import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
// import loadVersion from "vite-plugin-package-version";

// We can't use a symlink here: https://github.com/vitejs/vite/issues/5370
// import { closurify } from "../shared/src";

export default defineConfig({
  publicDir: './public',
  plugins: [
    cssInjectedByJsPlugin(),
    // loadVersion(),
    // closurify({ files: ["bigCommerce.js"] }),
  ],
  resolve: {
    alias: {
      '@checkout-sdk/shared': resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  build: {
    assetsDir: './',
    minify: true,
    // lib: {
    //   // Could also be a dictionary or array of multiple entry points.
    //   entry: 'src/index.ts',
    //   name: 'custom',
    //   fileName: 'custom',
    //   // Change this to the formats you want to support.
    //   // Don't forget to update your package.json as well.
    //   // formats: ['es', 'cjs'],
    // },
    rollupOptions: {
      treeshake: false,
      input: {
        custom: resolve(__dirname, 'src/index.ts'),
      },
      output: {
        manualChunks: undefined,
        entryFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
      external: [],
    },
  },
});
