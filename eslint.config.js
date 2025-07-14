import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
// import json from "@eslint/json";
// import css from "@eslint/css";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } }
  },
  tseslint.configs.recommended,
  tseslint.config({
    rules: {
      "@typescript-eslint/no-unused-vars": "warn"
    }
  }),
  pluginVue.configs["flat/essential"],
  globalIgnores([
    "./ts-out/",
    "coverage/",
    "dist/",
    "docs/",
    "tests/",
    "src/shim*.ts"
  ]),
  {
    files: ["**/*.vue"],
    languageOptions: { parserOptions: { parser: tseslint.parser } }
  },
  // { files: ["**/*.json"], plugins: { json }, language: "json/json" },
  // { files: ["**/*.css"], plugins: { css }, language: "css/css" }
  {
    rules: {
      "prefer-const": "off",
      "vue/valid-v-slot": [
        "error",
        {
          allowModifiers: true
        }
      ]
    }
  }
]);
