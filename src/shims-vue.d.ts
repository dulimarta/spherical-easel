declare module "*.vue" {
  import Vue from "vue";
  export default Vue;
}
declare module "vite";

interface ImportMeta {
  env: {
    MODE: "development" | "production" | "test"
    BASE_URL: string;
    VITE_APP_I18N_LOCALE: string
    VITE_APP_I18N_FALLBACK_LOCALE: string
  };
}
