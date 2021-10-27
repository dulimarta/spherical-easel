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
          iconName: "point",
          emphasizeTypes: [["point", "front", "back"]],
          mdiIcon: false,
          filePath: "../../icons/iconPointPaths.svg"
        }
      },
      line: {
        component: IconBase,
        props: {
          iconName: "line",
          mdiIcon: false,
          emphasizeTypes: [
            ["line", "front", "back"],
            ["point", "front", "back"]
          ],
          filePath: "../../icons/iconLinePaths.svg"
        }
      },
      segment: {
        component: IconBase,
        props: {
          iconName: "segment",
          mdiIcon: false,
          emphasizeTypes: [
            ["segment", "front", "back"],
            ["point", "front", "back"]
          ],
          filePath: "../../icons/iconSegmentPaths.svg"
        }
      },
      circle: {
        component: IconBase,
        props: {
          iconName: "circle",
          mdiIcon: false,
          emphasizeTypes: [
            ["circle", "front", "back"],
            ["point", "front", "back"]
          ],
          filePath: "../../icons/iconCirclePaths.svg"
        }
      },
      antipodalPoint: {
        component: IconBase,
        props: {
          iconName: "antipodalPoint",
          mdiIcon: false,
          emphasizeTypes: [["point", "front"]],
          filePath: "../../icons/iconAntipodalPointPaths.svg"
        }
      },
      polar: {
        component: IconBase,
        props: {
          iconName: "polar",
          mdiIcon: false,
          emphasizeTypes: [
            ["point", "front"],
            ["line", "front"]
          ],
          filePath: "../../icons/iconPolarPaths.svg"
        }
      },
      perpendicular: {
        component: IconBase,
        props: {
          iconName: "perpendicular",
          mdiIcon: false,
          emphasizeTypes: [
            ["point", "front"],
            ["line", "front", "back"]
          ],
          filePath: "../../icons/iconPerpendicularPaths.svg"
        }
      },
      tangent: {
        component: IconBase,
        props: {
          iconName: "tangent",
          mdiIcon: false,
          emphasizeTypes: [
            ["point", "front"],
            ["line", "front", "back"]
          ],
          filePath: "../../icons/iconTangentPaths.svg"
        }
      },
      intersect: {
        component: IconBase,
        props: {
          iconName: "intersect",
          mdiIcon: false,
          emphasizeTypes: [["point", "front"]],
          filePath: "../../icons/iconIntersectPaths.svg"
        }
      },
      pointOnObject: {
        component: IconBase,
        props: {
          iconName: "pointOnObject",
          mdiIcon: false,
          emphasizeTypes: [["point", "front"]],
          filePath: "../../icons/iconPointOnObjectPaths.svg"
        }
      },
      angle: {
        component: IconBase,
        props: {
          iconName: "angle",
          emphasizeTypes: [["angleMarker", "back", "front"]],
          mdiIcon: false,
          filePath: "../../icons/iconAnglePaths.svg"
        }
      },
      segmentLength: {
        component: IconBase,
        props: {
          iconName: "segmentLength",
          mdiIcon: false,
          emphasizeTypes: [["segment", "back", "front"]],
          filePath: "../../icons/iconSegmentLengthPaths.svg"
        }
      },
      pointDistance: {
        component: IconBase,
        props: {
          iconName: "pointDistance",
          mdiIcon: false,
          emphasizeTypes: [["point", "front", "back"]],
          filePath: "../../icons/iconPointDistancePaths.svg"
        }
      },
      ellipse: {
        component: IconBase,
        props: {
          iconName: "ellipse",
          mdiIcon: false,
          emphasizeTypes: [["point", "front", "back"]],
          filePath: "../../icons/iconEllipsePaths.svg"
        }
      },
      parametric: {
        component: IconBase,
        props: {
          iconName: "parametric",
          mdiIcon: false,
          emphasizeTypes: [
            ["point", "front"],
            ["parametric", "front"]
          ],
          filePath: "../../icons/iconParametricPaths.svg"
        }
      },
      measureTriangle: {
        component: IconBase,
        props: {
          iconName: "measureTriangle",
          mdiIcon: false,
          emphasizeTypes: [
            ["point", "front"],
            ["angleMarker", "back", "front"]
          ],
          filePath: "../../icons/iconMeasureTrianglePaths.svg"
        }
      },
      measurePolygon: {
        component: IconBase,
        props: {
          iconName: "measurePolygon",
          mdiIcon: false,
          emphasizeTypes: [
            ["point", "front"],
            ["angleMarker", "back", "front"]
          ],
          filePath: "../../icons/iconMeasurePolygonPaths.svg"
        }
      },
      midpoint: {
        component: IconBase,
        props: {
          iconName: "midpoint",
          mdiIcon: false,
          emphasizeTypes: [
            ["segment", "front"],
            ["point", "front"]
          ],
          filePath: "../../icons/iconMidpointPaths.svg"
        }
      },
      nSectPoint: {
        component: IconBase,
        props: {
          iconName: "nSectPoint",
          mdiIcon: false,
          emphasizeTypes: [
            ["segment", "front"],
            ["point", "front"]
          ],
          filePath: "../../icons/iconNSectPointPaths.svg"
        }
      },
      angleBisector: {
        component: IconBase,
        props: {
          iconName: "angleBisector",
          mdiIcon: false,
          emphasizeTypes: [
            ["line", "front", "back"],
            ["angleMarker", "front"]
          ],
          filePath: "../../icons/iconAngleBisectorPaths.svg"
        }
      },
      nSectLine: {
        component: IconBase,
        props: {
          iconName: "nSectLine",
          mdiIcon: false,
          emphasizeTypes: [
            ["line", "front", "back"],
            ["angleMarker", "front"]
          ],
          filePath: "../../icons/iconNSectLinePaths.svg"
        }
      },
      coordinate: {
        component: IconBase,
        props: {
          iconName: "coordinate",
          mdiIcon: "mdi-axis-arrow-info",
          emphasizeTypes: [[]]
        }
      },
      delete: {
        component: IconBase,
        props: {
          iconName: "delete",
          mdiIcon: "mdi-delete",
          emphasizeTypes: [[]]
        }
      },
      hide: {
        component: IconBase,
        props: {
          iconName: "hide",
          mdiIcon: "mdi-file-hidden",
          emphasizeTypes: [[]]
        }
      },
      iconFactory: {
        component: IconBase,
        props: {
          iconName: "iconFactory",
          mdiIcon: "mdi-plus",
          emphasizeTypes: [[]]
        }
      },
      move: {
        component: IconBase,
        props: {
          iconName: "move",
          mdiIcon: "mdi-cursor-move",
          emphasizeTypes: [[]]
        }
      },
      rotate: {
        component: IconBase,
        props: {
          iconName: "rotate",
          mdiIcon: "mdi-rotate-3d-variant",
          emphasizeTypes: [[]]
        }
      },
      select: {
        component: IconBase,
        props: {
          iconName: "select",
          mdiIcon: "mdi-cursor-pointer",
          emphasizeTypes: [[]]
        }
      },
      toggleLabelDisplay: {
        component: IconBase,
        props: {
          iconName: "toggleLabelDisplay",
          mdiIcon: "mdi-toggle-switch-off-outline",
          emphasizeTypes: [[]]
        }
      },
      zoomFit: {
        component: IconBase,
        props: {
          iconName: "zoomFit",
          mdiIcon: "mdi-magnify-scan",
          emphasizeTypes: [[]]
        }
      },
      zoomIn: {
        component: IconBase,
        props: {
          iconName: "zoomIn",
          mdiIcon: "mdi-magnify-plus-outline",
          emphasizeTypes: [[]]
        }
      },
      zoomOut: {
        component: IconBase,
        props: {
          iconName: "zoomOut",
          mdiIcon: "mdi-magnify-minus-outline",
          emphasizeTypes: [[]]
        }
      },
      toolsTab: {
        component: IconBase,
        props: {
          iconName: "toolsTab",
          emphasizeTypes: [[]],
          mdiIcon: "mdi-tools",
          filePath: ""
        }
      },
      objectsTab: {
        component: IconBase,
        props: {
          iconName: "objectsTab",
          emphasizeTypes: [[]],
          mdiIcon: "mdi-format-list-bulleted",
          filePath: ""
        }
      },
      constructionsTab: {
        component: IconBase,
        props: {
          iconName: "constructionsTab",
          emphasizeTypes: [[]],
          mdiIcon: "mdi-database",
          filePath: ""
        }
      },
      calculationObject: {
        component: IconBase,
        props: {
          iconName: "calculationObject",
          emphasizeTypes: [[]],
          mdiIcon: "mdi-calculator-variant",
          filePath: ""
        }
      },
      measurementObject: {
        component: IconBase,
        props: {
          iconName: "measurementObject",
          emphasizeTypes: [[]],
          mdiIcon: "mdi-math-compass",
          filePath: ""
        }
      },
      slider: {
        component: IconBase,
        props: {
          iconName: "slider",
          emphasizeTypes: [[]],
          mdiIcon: "mdi-slide",
          filePath: ""
        }
      }
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
