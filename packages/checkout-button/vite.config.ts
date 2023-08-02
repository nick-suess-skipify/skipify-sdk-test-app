/// <reference types="vitest" />
/// <reference types="vite-plugin-svgr/client" />
import { defineConfig } from 'vite';
import { resolve } from 'path';
import commonjs from '@rollup/plugin-commonjs';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
    cacheDir: '../../node_modules/.vite/checkout-button',
    publicDir: './src/public',
    plugins: [svgr(), commonjs()],

    // Configuration for building your library.
    // See: https://vitejs.dev/guide/build.html#library-mode
    resolve: {
        alias: {
            '@checkout-sdk/shared': resolve(__dirname, '../shared/src'),
        },
    },
    build: {
        assetsDir: './',
        minify: true,
        rollupOptions: {
            treeshake: false,
            input: {
                ['checkoutButton']: resolve(__dirname, 'src/index.ts'),
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
