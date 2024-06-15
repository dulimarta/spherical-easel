import bahasa from "./src/i18n"
import { config } from "@vue/test-utils"

if (!globalThis.defined) {
  config.global.plugins = [bahasa]
  globalThis.defined = true
}