import { createI18n } from "vue-i18n";
import messagesEn from "@/assets/languages/en.json";
import messagedId from "@/assets/languages/id.json";

export default createI18n({
  locale: import.meta.env.VITE_APP_I18N_LOCALE || "en",
  allowComposition: true,
  legacy: false,
  /* skip the function call in a test environment */
  messages: {
    en: messagesEn,
    id: messagedId
  },
  fallbackWarn: false,
  missingWarn: true
});
