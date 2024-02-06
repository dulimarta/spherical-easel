/// <reference types="vitest" />

import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(viteConfig, defineConfig({
    test: {
        globals: true,
        environment: "jsdom",
        include: ["**/*dialog.spec.ts"],
        server: {
            deps: {
                inline: ["vuetify"]
            }
        },
    },
}))
