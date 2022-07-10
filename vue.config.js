const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
  productionSourceMap: false, // disable source map on production build
  transpileDependencies: ["vuetify"],
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
  publicPath: "/",
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
  chainWebpack: config => {
    // Use babel-loader for files under node_modules/two.js
    config.module
      .rule("ES6 loader")
      .test(/.+two\.js.+\.js/)
      .use("babel-loader")
      .loader("babel-loader")
      .end();
  }
});
