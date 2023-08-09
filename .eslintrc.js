module.exports = {
  root: true,
  parser: "vue-eslint-parser",
  parserOptions: {
      parser: "@typescript-eslint/parser",
      ecmaVersion: 2020,
  },
  env: {
    browser: true, es2020: true, node:true
  },
  extends: [
    "eslint:recommended",
    "plugin:vue/vue3-essential",
    "prettier"
  ],
  plugins: ["@typescript-eslint", "prettier"],
  rules: {
    // "vue/multi-word-component-names": "off"
    "vue/no-unused-vars": "error",
    "space-before-function-paren": "off",
    "vue/multi-word-component-names":"off"
  },
  overrides: [
    {
      files: [
        "**/__tests__/*.{j,t}s?(x)",
        "**/tests/unit/**/*.spec.{j,t}s?(x)"
      ],
      env: {
        jest: true
      }
    }
  ]
};
