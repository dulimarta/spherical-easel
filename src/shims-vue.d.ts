// declare module "*.vue" {
//   import Vue from "vue";
//   export default Vue;
// }
declare module "vite";

interface ImportMeta {
  env: {
    [x: string]: any;
    MODE: "development" | "production" | "test"
    BASE_URL: string;
    VITE_APP_I18N_LOCALE: string;
    VITE_APP_I18N_FALLBACK_LOCALE: string;
    VITE_APP_FIREBASE_API_KEY: string;
    VITE_APP_GOOGLE_MAP_API_KEY: string;
  };
}

declare module 'vue' {
  import { CompatVue } from "@vue/runtime-dom";
  const Vue: CompatVue
  export default Vue
  export * from "@vue/runtime-dom"
  const { configureCompat } = Vue
  export {configureCompat}
}