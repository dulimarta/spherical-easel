module.exports = {
  transpileDependencies: ["vuetify"],
  pluginOptions: {
    i18n: {
      locale: "en",
      fallbackLocale: "en",
      localeDir: "languages",
      enableInSFC: false
    }
  }
  // crossorigin: "no-cors",
  // devServer: {
  //   proxy: {
  //     "^/api": {
  //       target: "https://tikzjax.com",
  //       ws: true,
  //       changeOrigin: true
  //     }
  //   }
  // }
};
