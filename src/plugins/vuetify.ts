// import "@mdi/font/css/materialdesignicons.css"
import { h, JSXComponent } from "vue";
import {
  createVuetify,
  IconSet,
  IconProps,
  IconOptions,
  IconAliases
} from "vuetify";
import "vuetify/styles";

// import colors from "vuetify/es5/util/colors";
import IconBase from "@/components/IconBase.vue";
import SETTINGS from "@/global-settings";
type MyIconProp = {
  iconName: string;
};
// const MyIcon: JSXComponent<MyIconProp> = prop => {
//   console.debug("Custom SVG icon", prop);
// };

const point: IconSet = {
  component: (prop: IconProps) => {
    console.debug("What is icon set?", prop.icon, prop.tag);
  }
};

const iconNames = [
  "angle",
  "angleBisector",
  "antipodalPoint",
  "applyTransformation",
  "appSettings",
  "calculationObject",
  "circle",
  "clearConstruction",
  "constructionsTab",
  "coordinate",
  "copyToClipboard",
  "cycleNodeValueDisplayMode",
  "delete",
  "deleteConstruction",
  "deleteNode",
  "downloadConstruction",
  "ellipse",
  "hide",
  "hideNode",
  "hideNodeLabel",
  "iconFactory",
  "intersect",
  "inversion",
  "line",
  "measuredCircle",
  "measurementObject",
  "measurePolygon",
  "measureTriangle",
  "midpoint",
  "move",
  "notifications",
  "nSectLine",
  "nSectPoint",
  "objectsTab",
  "parametric",
  "perpendicular",
  "point",
  "pointDistance",
  "pointOnObject",
  "pointReflection",
  "polar",
  "redo",
  "reflection",
  "rotate",
  "rotation",
  "segment",
  "segment",
  "segmentLength",
  "select",
  "shareConstruction",
  "showNode",
  "showNodeLabel",
  "slider",
  "stylePanel",
  "tangent",
  "threePointCircle",
  "toggleLabelDisplay",
  "toolsTab",
  "transformedCircle",
  "transformedEllipse",
  "transformedLine",
  "transformedPoint",
  "transformedSegment",
  "translation",
  "undo",
  "zoomFit",
  "zoomIn",
  "zoomOut",
];

const toRecord = (n: Array<string>): Record<string, JSXComponent> => {
  return n.reduce((acc: Record<string, JSXComponent>, curr: string, pos: number) => {
    return {
      ...acc,
      [curr]: () => h(IconBase as any, { iconName: curr })
    };
  }, {} as Record<string, JSXComponent>);
};
// console.debug("What is going on?", toRecord(iconNames));

/* This allows us to set the global style variables to adjust the look and feel of the
app from one central place. */
export default createVuetify({
  icons: {
    // defaultSet: "se_custom",
    defaultSet: "mdi", // builtin sets: faSvg, fa, fa4, mdi, mdi, mdiSvg
    aliases: toRecord(iconNames),
    sets: {
      se_custom: {
        component: (props: IconProps, ctx) => {
          console.debug("Where am I", props, "context", ctx);
          return h(props.tag, { class: [props.icon, "bx"] });
        }
      }
    }
  },
  theme: {
    themes: {
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
