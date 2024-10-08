/// <reference types="vitest" />
/// <reference types="vite-plugin-svgr/client" />
import { defineConfig } from 'vite';
import { resolve } from 'path';
import commonjs from '@rollup/plugin-commonjs';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/shared',
  publicDir: './src/public',
  plugins: [svgr(), commonjs()],

  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    assetsDir: './assets',
    minify: true,
    // lib: {
    // Could also be a dictionary or array of multiple entry points.
    // entry: [''],
    // name: 'shared',
    // fileName: 'shared',
    // Change this to the formats you want to support.
    // Don't forget to update your package.json as well.
    // formats: ['es', 'cjs'],
    // },
    rollupOptions: {
      treeshake: false,
      input: {
        shared: resolve(__dirname, 'src/index.ts'),
        ['components/checkoutbutton']: resolve(__dirname, 'src/lib/components/checkout-button/checkoutButton.tsx'),
        ['components/testpage']: resolve(__dirname, 'src/lib/components/test-page/testPage.tsx'),
        ['components/embedded_components_test_page']: resolve(__dirname, 'src/lib/components/embedded-components-test-page/testPage.tsx'),
        ['components/enrollmentcheckbox']: resolve(
          __dirname,
          'src/lib/components/enrollment-checkbox/enrollmentCheckbox.tsx'
        ),
      },
      output: {
        manualChunks: undefined,
        entryFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
      // External packages that should not be bundled into your library.
      external: [],
    },
  },
});
