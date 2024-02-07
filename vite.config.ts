import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
// import vueI18n from "@intlify/unplugin-vue-i18n";

// import {createVuePlugin as vue} from "vite-plugin-vue2"
// import { VuetifyResolver } from "unplugin-vue-components/resolvers"
// import Components from "unplugin-vue-components/vite"

import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
export default defineConfig({
  // define: {
  //   'process.env': process.env
  // },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src")
      // vue: "@vue/compat"
    },
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"]
  },
  plugins: [
    vue({
      template: {
        transformAssetUrls,
        compilerOptions: {
          compatConfig: {
            MODE: 3
          }
        }
      }
    }),
    // Components({
    //   resolvers: [VuetifyResolver()]
    // })
    // i18n({
    //   path: resolve(__dirname, "./src")
    // }),
    vuetify({
      autoImport: true,
      styles: {
        configFile: "src/scss/app.scss"
      }
    }),
    VueI18nPlugin({
      include: [resolve(__dirname, "./src/assets/languages/**")],
      strictMessage: true /* messages should not contain HTML tags */,
      allowDynamic: true,
      bridge: false /* specify custom blocks to  work under both v8 and v9 */
    })
  ],
  server: {
    port: 8080
  }
});
