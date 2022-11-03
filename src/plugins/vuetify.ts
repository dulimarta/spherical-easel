// import "@mdi/font/css/materialdesignicons.css"
import Vue from "vue";
import Vuetify from "vuetify/lib";

Vue.use(Vuetify);

import colors from "vuetify/es5/util/colors";
import IconBase from "../components/IconBase.vue";
import SETTINGS from "@/global-settings";

/* This allows us to set the global style variables to adjust the look and feel of the
app from one central place. */
const vuetify = new Vuetify({
  iconfont: "mdiSvg",
  icons: {
    values: {
      point: {
        component: IconBase,
        props: {
          iconName: "point" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      line: {
        component: IconBase,
        props: {
          iconName: "line" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      segment: {
        component: IconBase,
        props: {
          iconName: "segment" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      circle: {
        component: IconBase,
        props: {
          iconName: "circle" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      antipodalPoint: {
        component: IconBase,
        props: {
          iconName: "antipodalPoint" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      polar: {
        component: IconBase,
        props: {
          iconName: "polar" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      perpendicular: {
        component: IconBase,
        props: {
          iconName: "perpendicular" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      tangent: {
        component: IconBase,
        props: {
          iconName: "tangent" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      intersect: {
        component: IconBase,
        props: {
          iconName: "intersect" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      pointOnObject: {
        component: IconBase,
        props: {
          iconName: "pointOnObject" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      angle: {
        component: IconBase,
        props: {
          iconName: "angle" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      segmentLength: {
        component: IconBase,
        props: {
          iconName: "segmentLength" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      pointDistance: {
        component: IconBase,
        props: {
          iconName: "pointDistance" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      ellipse: {
        component: IconBase,
        props: {
          iconName: "ellipse" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      parametric: {
        component: IconBase,
        props: {
          iconName: "parametric" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      measureTriangle: {
        component: IconBase,
        props: {
          iconName: "measureTriangle" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      measurePolygon: {
        component: IconBase,
        props: {
          iconName: "measurePolygon" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      midpoint: {
        component: IconBase,
        props: {
          iconName: "midpoint" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      nSectPoint: {
        component: IconBase,
        props: {
          iconName: "nSectPoint" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      angleBisector: {
        component: IconBase,
        props: {
          iconName: "angleBisector" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      nSectLine: {
        component: IconBase,
        props: {
          iconName: "nSectLine" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      threePointCircle: {
        component: IconBase,
        props: {
          iconName: "threePointCircle" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      translation: {
        component: IconBase,
        props: {
          iconName: "translation" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      rotation: {
        component: IconBase,
        props: {
          iconName: "rotation" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      reflection: {
        component: IconBase,
        props: {
          iconName: "reflection" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      pointReflection: {
        component: IconBase,
        props: {
          iconName: "pointReflection" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      inversion: {
        component: IconBase,
        props: {
          iconName: "inversion" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      measuredCircle: {
        component: IconBase,
        props: {
          iconName: "measuredCircle" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      coordinate: {
        component: IconBase,
        props: {
          iconName: "coordinate" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      delete: {
        component: IconBase,
        props: {
          iconName: "delete" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      hide: {
        component: IconBase,
        props: {
          iconName: "hide" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      iconFactory: {
        component: IconBase,
        props: {
          iconName: "iconFactory" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      move: {
        component: IconBase,
        props: {
          iconName: "move" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      rotate: {
        component: IconBase,
        props: {
          iconName: "rotate" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      select: {
        component: IconBase,
        props: {
          iconName: "select" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      toggleLabelDisplay: {
        component: IconBase,
        props: {
          iconName: "toggleLabelDisplay" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      zoomFit: {
        component: IconBase,
        props: {
          iconName: "zoomFit" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      zoomIn: {
        component: IconBase,
        props: {
          iconName: "zoomIn" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      zoomOut: {
        component: IconBase,
        props: {
          iconName: "zoomOut" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      toolsTab: {
        component: IconBase,
        props: {
          iconName: "toolsTab" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      objectsTab: {
        component: IconBase,
        props: {
          iconName: "objectsTab" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      constructionsTab: {
        component: IconBase,
        props: {
          iconName: "constructionsTab" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      calculationObject: {
        component: IconBase,
        props: {
          iconName: "calculationObject" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      measurementObject: {
        component: IconBase,
        props: {
          iconName: "measurementObject" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      slider: {
        component: IconBase,
        props: {
          iconName: "slider" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      stylePanel: {
        component: IconBase,
        props: {
          iconName: "stylePanel" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      notifications: {
        component: IconBase,
        props: {
          iconName: "notifications" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      downloadConstruction: {
        component: IconBase,
        props: {
          iconName: "downloadConstruction" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      shareConstruction: {
        component: IconBase,
        props: {
          iconName: "shareConstruction" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      deleteConstruction: {
        component: IconBase,
        props: {
          iconName: "deleteConstruction" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      cycleNodeValueDisplayMode: {
        component: IconBase,
        props: {
          iconName: "cycleNodeValueDisplayMode" // The name of the icon that is passed to IconBase, the other properties of the icon are in the global settings because in order to access them from both the src and VuePress we need to store the props there.
        }
      },
      showNode: {
        component: IconBase,
        props: {
          iconName: "showNode"
        }
      },
      hideNode: {
        component: IconBase,
        props: {
          iconName: "hideNode"
        }
      },
      showNodeLabel: {
        component: IconBase,
        props: {
          iconName: "showNodeLabel"
        }
      },
      hideNodeLabel: {
        component: IconBase,
        props: {
          iconName: "hideNodeLabel"
        }
      },
      deleteNode: {
        component: IconBase,
        props: {
          iconName: "deleteNode"
        }
      },
      appSettings: {
        component: IconBase,
        props: {
          iconName: "appSettings"
        }
      },
      clearConstruction: {
        component: IconBase,
        props: {
          iconName: "clearConstruction"
        }
      },
      undo: {
        component: IconBase,
        props: {
          iconName: "undo"
        }
      },
      redo: {
        component: IconBase,
        props: {
          iconName: "redo"
        }
      },
      copyToClipboard: {
        component: IconBase,
        props: {
          iconName: "copyToClipboard"
        }
      },
      applyTransformation: {
        component: IconBase,
        props: {
          iconName: "applyTransformation"
        }
      },
      transformedPoint: {
        component: IconBase,
        props: {
          iconName: "transformedPoint"
        }
      },
      transformedCircle: {
        component: IconBase,
        props: {
          iconName: "transformedCircle"
        }
      },
      transformedSegment: {
        component: IconBase,
        props: {
          iconName: "transformedSegment"
        }
      },
      transformedLine: {
        component: IconBase,
        props: {
          iconName: "transformedLine"
        }
      },
      transformedEllipse: {
        component: IconBase,
        props: {
          iconName: "transformedEllipse"
        }
      },

    }
  },
  theme: {
    themes: {
      light: {
        /* TODO: PICK BETTER COLORS!!!!! */
        primary: colors.blue.base,
        secondary: colors.cyan.base,
        //accent: colors.shades.white,
        accent: colors.blue.lighten4,
        error: colors.red.base,
        warning: colors.orange.base,
        info: colors.blue.base,
        success: colors.orange.base,
        background: "#FFFFFF"
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
