import { resolve } from "path";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  publicDir: './public',
  plugins: [
    cssInjectedByJsPlugin(),
  ],
  build: {
    assetsDir: './',
    minify: false,
    rollupOptions: {
      treeshake: false,
      input: {
        bigCommerce: resolve(__dirname, "src/bigcommerce/bigcommerce.ts"),
        shopify: resolve(__dirname, "src/shopify/shopify.ts"),
        skipifyEnrollmentCheckbox: resolve(__dirname, "src/components/skipifyEnrollmentCheckbox.tsx"),
      },
      output: {
        manualChunks: undefined,
        entryFileNames: "[name].js",
        assetFileNames:  "[name][extname]"
      }
    },
  },
});
