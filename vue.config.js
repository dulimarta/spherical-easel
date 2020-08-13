module.exports = {
  transpileDependencies: ["vuetify", "vuex-module-decorators"],
  pluginOptions: {
    i18n: {
      locale: "en",
      fallbackLocale: "en",
      localeDir: "languages",
      enableInSFC: true
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
