import bahasa from "./src/i18n"
import { config } from "@vue/test-utils"

// This import solve the following error:
// Error: Not implemented: HTMLCanvasElement.prototype.getContext
import "vitest-canvas-mock"

if (!globalThis.defined) {
  config.global.plugins = [bahasa]
  globalThis.defined = true
}
