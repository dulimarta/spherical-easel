import { defineConfig } from "vite"
import {resolve} from "path"
import vue from "@vitejs/plugin-vue"

// import {createVuePlugin as vue} from "vite-plugin-vue2"
// import { VuetifyResolver } from "unplugin-vue-components/resolvers"
// import Components from "unplugin-vue-components/vite"

import vueI18nPlugin from "@intlify/vite-plugin-vue-i18n";
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
export default defineConfig({
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
    vuetify({ autoImport: true }),
    vueI18nPlugin({})
  ],
  server: {
    port: 8080
  }
});