import { defineConfig } from "vite"
import {resolve} from "path"
import vue from "@vitejs/plugin-vue2"
import { VuetifyResolver } from "unplugin-vue-components/resolvers"
import Components from "unplugin-vue-components/vite"

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src")
    },
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"]
  },
  plugins: [
    vue({}),
    Components({
      resolvers: [VuetifyResolver()]
    })
  ],
  server: {
    port: 8080
  }
})
