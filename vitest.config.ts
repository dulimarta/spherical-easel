/// <reference types="vitest" />

import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";
import path from "path";
import { castToVueI18n } from "vue-i18n";
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: "jsdom",
      include: ["**/construction-loader.spec.ts"],
      server: {
        deps: {
          inline: ["vuetify", "vue-i18n"]
        }
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      }
    }
  })
);
