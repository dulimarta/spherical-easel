module.exports = {
  vueFiles: "./src/**/*.?(ts|vue)",
  languageFiles: "./src/assets/languages/*.json",
  detect: ["missing", "dynamic"],
  exclude: ["buttons"],
  add: false,
  remove: false,
  ci: false,
  separator: ".",
  missingTranslationString: "Missing Translation",
  noEmptyTranslation: "id"
}