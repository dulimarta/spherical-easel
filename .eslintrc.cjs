module.exports = {
  root: true,
  parser: "vue-eslint-parser",
  parserOptions: {
      parser: "@typescript-eslint/parser",
      ecmaVersion: "latest",
      sourceType: "module"
  },
  env: {
    browser: true, es2020: true, node:true
  },
  extends: [
    "plugin:@typescript-eslint/recommended",
    "eslint:recommended",
    "plugin:prettier/recommended",
    "plugin:vue/vue3-recommended",
    "prettier"
  ],
  plugins: ["prettier", "@typescript-eslint"],
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
