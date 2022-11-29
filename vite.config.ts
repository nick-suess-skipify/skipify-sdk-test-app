import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    assetsDir: './',
    minify: false,
    rollupOptions: {
      treeshake: false,
      input: {
        bigCommerce: resolve(__dirname, "src/bigcommerce/bigcommerce.ts"),
        shopify: resolve(__dirname, "src/shopify/shopify.ts")
      },
      output: {
        entryFileNames: "[name].js",
        assetFileNames:  "[name][extname]"
      }
    },
  },
});
