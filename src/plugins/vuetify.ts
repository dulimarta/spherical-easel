// import "@mdi/font/css/materialdesignicons.css"
import Vue from "vue";
import Vuetify from "vuetify/lib";

Vue.use(Vuetify);

import colors from "vuetify/es5/util/colors";

/* This allows us to set the global style variables to adjust the look and feel of the 
app from one central place. */
const vuetify = new Vuetify({
  icons: { iconfont: "mdiSvg" },
  theme: {
    themes: {
      light: {
        /* TODO: PICK BETTER COLORS!!!!! */
        /*         primary: colors.blue.base,
        secondary: colors.cyan.base,
        accent: colors.shades.white,
        //accent: colors.blue.lighten1, 
        error: colors.red.base,
        warning: colors.yellow.base,
        info: colors.blue.base,
        success: colors.orange.base */
      },
      dark: {
        primary: colors.blue.lighten3
      }
    },
    options: {
      /* Enable var(--prop) om CSS */
      customProperties: true
    }
  }
});
export default vuetify;
