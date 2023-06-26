module.exports = {
  vueFiles: "./src/**/*.?(ts|vue)",
  languageFiles: "./src/assets/languages/*.json",
  exclude: ["notifications", "toolGroups", "buttons"],
  add: true,
  remove: false,
  ci: false,
  separator: ".",
  missingTranslationString: "Missing Translation",
  noEmptyTranslation: "id"
}