import { createI18n } from "vue-i18n";
// import messagesEn from "@/assets/languages/en";
// import messagedId from "@/assets/languages/id";
import messages from "@intlify/unplugin-vue-i18n/messages"

export default createI18n({
  locale: import.meta.env.VITE_APP_I18N_LOCALE || "en",
  /* skip the function call in a test environment */
  messages /*{
    en: messagesEn,
    id: messagedId
  }*/
});
