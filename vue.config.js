module.exports = {
  transpileDependencies: ["vuetify", "vuex-module-decorators"],
  pluginOptions: {
    i18n: {
      locale: "en",
      fallbackLocale: "en",
      localeDir: "assets/languages",
      enableInSFC: true
    }
  },
  // Use "/sphericalgeometryvue/" to deploy it on GitLab
  // Use "/" to deploy it on Netlify
  publicPath:
    process.env.NODE_ENV === "production" ? "/sphericalgeometryvue/" : "/"
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
