/// <reference types="vitest" />

import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.mts";
import path from "path";
// import { castToVueI18n } from "vue-i18n";
export default mergeConfig(
  viteConfig,
  defineConfig({
    root: "./src",
    test: {
      globals: true,
      setupFiles: ["./vitest-setup.mts"],
      environment: "jsdom",
      //include: [
        //"**/sphereframe.spec.ts"
        //"**/parametric-cusp-values.spec.ts",
        //"**/parametric-coord.spec.ts",
        //"**/eventHandlers/__tests__/*.spec.ts"
      //],
      server: {
        deps: {
          inline: ["vuetify", "vue-i18n"]
        }
      },
      watch: true
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "$": path.resolve(__dirname, "./tests")
      }
    }
  })
);
