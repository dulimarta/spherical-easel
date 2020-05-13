import Vue from "vue";
import VueI18n from "vue-i18n";

Vue.use(VueI18n);

//try to detect browser language
//var language =  window.navigator.language.substring(0,2);

//For now hard code English
const language = "en";
let selection = "";

// if a language is detected, import that specific JSON language file otherwise default to English
if (language) {
  selection = require("../languages/" + language + ".lang");
} else {
  selection = require("../languages/en.lang");
}

//access the imported file with locale
const messages = {
  locale: {
    message: selection
  }
};

//create a new vueI18n instance with options
const i18n = new VueI18n({
  locale: "locale",
  messages
});

export default i18n;
