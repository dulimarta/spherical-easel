// import pluginVue from "eslint-plugin-vue"
// import tsParser from "@typescript-eslint/parser"
module.exports = {
  // ...pluginVue.configs['flat/essential'],
  root: true, // Tell ESList to stop looking for parent level config file
  // languageOptions: {
    parser: "vue-eslint-parser",
    parserOptions: {
      parser: '@typescript-eslint/parser',
  //     // ecmaVersion: "latest",
  //     // sourceType: "module"
    },
  // }
  env: {
    browser: true, es2020: true, node:true
  },
  extends: [
  //   "@vue/typescript/recommend",
  //   // "plugin:@typescript-eslint/recommended",
    "eslint:recommended",
  //   // "plugin:prettier/recommended",
    "plugin:vue/vue3-recommended",
    "prettier"
  ],
  plugins: ["vue", "prettier" /*, "@typescript-eslint" */],
  rules: {
    "vue/multi-word-component-names": "off",
    "prettier/prettier": ["error"]
  //   "vue/no-unused-vars": "error",
  //   // "space-before-function-paren": "never",
  //   "vue/multi-word-component-names":"off"
  },
  // overrides: [
  //   {
  //     files: [
  //       "**/__tests__/*.{j,t}s?(x)",
  //       "**/tests/unit/**/*.spec.{j,t}s?(x)"
  //     ],
  //     env: {
  //       jest: true
  //     }
  //   }
  // ]
};
