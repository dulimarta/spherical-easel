// import "@mdi/font/css/materialdesignicons.css"
// import { h, JSXComponent } from "vue";
import { createVuetify, IconProps, ThemeDefinition } from "vuetify";
import "vuetify/styles";
import "@/scss/settings.scss";
import { mdi } from "vuetify/iconsets/mdi";
import { customIcons } from "./iconAliases";
import colors from "vuetify/util/colors";

const SECustomTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: colors.red.base,
    'on-background': colors.red.lighten4,
    surface: colors.lightGreen.lighten5,
    'on-surface': colors.lightGreen.darken3,
    primary: colors.green.base,
    'on-primary': colors.green.lighten3,
    secondary: colors.blue.base,
    'on-secondary': colors.blue.accent4,
    success: colors.green.accent1,
    'on-success': colors.green.darken3,
    warning: colors.yellow.accent1,
    'on-warning': colors.shades.black,
    error: colors.red.accent1,
    'on-error': colors.red.lighten2,
    info: colors.grey.base,
    'on-info': colors.shades.black,
  }
};

/* This allows us to set the global style variables to adjust the look and feel of the
app from one central place. */
export default createVuetify({
  icons: {
    // defaultSet: "se_custom",
    defaultSet: "mdi", // builtin sets: faSvg, fa, fa4, mdi, mdi, mdiSvg
    aliases: customIcons,
    sets: {
      mdi
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
    defaultTheme: 'light', // "SECustomTheme",
    themes: {
      SECustomTheme
    }
    // options: {
    //   /* Enable var(--prop) om CSS */
    //   customProperties: true
    // }
  }
});
