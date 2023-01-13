import { resolve } from "path";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import loadVersion from 'vite-plugin-package-version';

import closurify from "./src/plugins/closurify";

export default defineConfig({
  publicDir: './public',
  plugins: [
    cssInjectedByJsPlugin(),
    loadVersion(),
    closurify({ files: ["bigCommerce.js"] }),
  ],
  build: {
    assetsDir: './',
    minify: true,
    rollupOptions: {
      treeshake: false,
      input: {
        bigCommerce: resolve(__dirname, "src/bigcommerce/bigcommerce.ts"),
        shopify: resolve(__dirname, "src/shopify/shopify.ts"),
        ['components/skipifyEnrollmentCheckbox']: resolve(__dirname, "src/components/skipifyEnrollmentCheckbox.tsx"),
      },
      output: {
        manualChunks: undefined,
        entryFileNames: "[name].js",
        assetFileNames:  "[name][extname]"
      }
    },
  },
});
