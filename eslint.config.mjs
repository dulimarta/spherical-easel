import pluginVue from "eslint-plugin-vue"
// import tsParser from "@typescript-eslint/parser"
export default {
  ...pluginVue.configs['flat/essential'],
  root: true,
  // languageOptions: {
  //   parser: "vue-eslint-parser",
  //   parserOptions: {
  //     parser: tsParser,
  //     // ecmaVersion: "latest",
  //     // sourceType: "module"
  //   },
  // }
  // env: {
  //   browser: true, es2020: true, node:true
  // },
  // extends: [
  //   "@vue/typescript/recommend",
  //   // "plugin:@typescript-eslint/recommended",
  //   "eslint:recommended",
  //   // "plugin:prettier/recommended",
  //   "plugin:vue/vue3-recommended",
  //   "prettier"
  // ],
  // // plugins: ["prettier", "@typescript-eslint"],
  // rules: {
  //   // "vue/multi-word-component-names": "off"
  //   "vue/no-unused-vars": "error",
  //   // "space-before-function-paren": "never",
  //   "vue/multi-word-component-names":"off"
  // },
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
