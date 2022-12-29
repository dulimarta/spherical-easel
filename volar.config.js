/** @type {import("@volar-plugins/prettier")} */

const { VolarPrettierPlugin } = require("@volar-plugins/prettier");
module.exports = {
  plugins: [
    VolarPrettierPlugin({
      languages: ["html", "typescript"],
      useVsCodeIndentation: true
    }),

  ]
}