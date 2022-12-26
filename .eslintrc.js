module.exports = {
  root: true,
  env: {
    // node: true,
    es2021: true,
  },
  extends: [
    // "plugin:vue/essential",
    // "eslint:recommend",
    // "@vue/typescript/recommended"
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    // "vue/multi-word-component-names": "off"
    "space-before-function-paren": "off"
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
