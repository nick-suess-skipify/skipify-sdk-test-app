import { defineConfig } from 'vite';

import viteTsConfigPaths from 'vite-tsconfig-paths';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
    return {
        cacheDir: '../../node_modules/.vite/embedded-components',

        esbuild: {
            drop: mode === 'production' ? ['console'] : [], // Drop console in production
        },

        plugins: [
            viteTsConfigPaths({
                // Enable tsconfig paths resolution
                root: '../../',
            }),

            cssInjectedByJsPlugin(), // Inject CSS from JS
        ],
        publicDir: './public',
        resolve: {
            alias: {
                '@checkout-sdk/shared': resolve(__dirname, '../shared/src'),
            },
        },
        build: {
            assetsDir: 'assets',
            minify: 'esbuild',
            sourcemap: mode !== 'production',
            lib: {
                entry: 'src/index.ts',
                formats: ['iife'], // Output as IIFE (immediately-invoked function expression)
                name: 'componentsSdk',
                fileName: () => 'components-sdk.js', // This is final output file name, subject to change
            },
            rollupOptions: {
                treeshake: true,
                output: {
                    dir: 'dist',
                },
            },
        },
    };
});
