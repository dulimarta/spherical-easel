// import "@mdi/font/css/materialdesignicons.css"
// import { h, JSXComponent } from "vue";
import {
  createVuetify,
  IconProps
} from "vuetify";
import "vuetify/styles";
import "@/scss/settings.scss";
import { customIcons } from "./iconAliases";
import colors from "vuetify/util/colors";

/* This allows us to set the global style variables to adjust the look and feel of the
app from one central place. */
export default createVuetify({
  icons: {
    // defaultSet: "se_custom",
    defaultSet: "mdi", // builtin sets: faSvg, fa, fa4, mdi, mdi, mdiSvg
    aliases: customIcons,
    sets: {
      // Is the following block used at all?
      // se_custom: {
      //   component: (props: IconProps, ctx) => {
      //     console.debug("Where am I", props, "context", ctx);
      //     return h(props.tag, { class: [props.icon, "bx"] });
      //   }
      // }
    }
  },
  defaults: {
    VTooltip: {
      openDelay: 500,
      closeDelay: 0,
      disabled: false
    }
  },
  theme: {
    defaultTheme: "SECustomTheme",
    themes: {
      SECustomTheme: {
        colors: {
          // accent: colors.orange.lighten4
        }
      },
      light: {
        /* TODO: PICK BETTER COLORS!!!!! */
        // primary: colors.blue.base,
        // secondary: colors.cyan.base,
        // //accent: colors.shades.white,
        // accent: colors.blue.lighten4,
        // error: colors.red.base,
        // warning: colors.orange.base,
        // info: colors.blue.base,
        // success: colors.orange.base,
        // background: "#FFFFFF"
      },
      dark: {
        // primary: colors.blue.lighten3
      }
    }
    // options: {
    //   /* Enable var(--prop) om CSS */
    //   customProperties: true
    // }
  }
});
