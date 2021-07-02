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
  publicPath: "/"
  // Use non-root path during development to detect potential issues
  // the the app is deployed for production into a non-root path
  // process.env.NODE_ENV === "production" ? "/sphericalgeometryvue/" : "/dev"
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
