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
          iconName: "point"
          // iconFile: "/icons/iconPointPaths.svg",
          // emphasizeTypes: SETTINGS.icons.point.emphasizeTypes //[["point", "front", "back"]]
        }
      },
      line: {
        component: IconBase,
        props: {
          iconName: "line"
          // iconFile: "/icons/iconLinePaths.svg",
          // emphasizeTypes: SETTINGS.icons.line.emphasizeTypes
        }
      },
      segment: {
        component: IconBase,
        props: {
          iconName: "segment"
          // iconFile: "/icons/iconSegmentPaths.svg",
          // emphasizeTypes: SETTINGS.icons.segment.emphasizeTypes
        }
      },
      circle: {
        component: IconBase,
        props: {
          iconName: "circle"
          // iconFile: "/icons/iconCirclePaths.svg",
          // emphasizeTypes: SETTINGS.icons.circle.emphasizeTypes
        }
      },
      antipode: {
        component: IconBase,
        props: {
          iconName: "antipode"
          // iconFile: "/icons/iconAntipodePaths.svg",
          // emphasizeTypes: SETTINGS.icons.antipode.emphasizeTypes
        }
      },
      polar: {
        component: IconBase,
        props: {
          iconName: "polar"
          // iconFile: "/icons/iconPolarPaths.svg",
          // emphasizeTypes: SETTINGS.icons.polar.emphasizeTypes
        }
      },
      perpendicular: {
        component: IconBase,
        props: {
          iconName: "perpendicular"
          // iconFile: "/icons/iconPerpendicularPaths.svg",
          // emphasizeTypes: SETTINGS.icons.perpendicular.emphasizeTypes
        }
      },
      tangent: {
        component: IconBase,
        props: {
          iconName: "tangent"
          // iconFile: "/icons/iconTangentPaths.svg",
          // emphasizeTypes: SETTINGS.icons.tangent.emphasizeTypes
        }
      },
      intersection: {
        component: IconBase,
        props: {
          iconName: "intersection"
          // iconFile: "/icons/iconIntersectionPaths.svg",
          // emphasizeTypes: SETTINGS.icons.ONTEline.emphasizeTypes
        }
      },
      pointOnObject: {
        component: IconBase,
        props: {
          iconName: "pointOnObject"
          // iconFile: "/icons/iconPointOnObjectPaths.svg",
          // emphasizeTypes: [["point", "front"]]
        }
      },
      angleMarker: {
        component: IconBase,
        props: {
          iconName: "angleMarker"
          // iconFile: "/icons/iconAngleMarkerPaths.svg",
          // emphasizeTypes: [["angleMarker", "back", "front"]]
        }
      },
      segmentLength: {
        component: IconBase,
        props: {
          iconName: "segmentLength"
          // iconFile: "/icons/iconSegmentLengthPaths.svg",
          // emphasizeTypes: [["segment", "back", "front"]]
        }
      },
      pointDistance: {
        component: IconBase,
        props: {
          iconName: "pointDistance"
          // iconFile: "/icons/iconPointDistancePaths.svg",
          // emphasizeTypes: [["point", "front", "back"]]
        }
      },
      ellipse: {
        component: IconBase,
        props: {
          iconName: "ellipse"
          // iconFile: "/icons/iconEllipsePaths.svg",
          // emphasizeTypes: [["point", "front", "back"]]
        }
      },
      parametric: {
        component: IconBase,
        props: {
          iconName: "parametric"
          // iconFile: "/icons/iconParametricPaths.svg",
          // emphasizeTypes: [
          //   ["point", "front"],
          //   ["parametric", "front"]
          // ]
        }
      },
      measuredTriangle: {
        component: IconBase,
        props: {
          iconName: "measuredTriangle"
          // iconFile: "/icons/iconMeasuredTrianglePaths.svg",
          // emphasizeTypes: [
          //   ["point", "front"],
          //   ["angleMarker", "back", "front"]
          // ]
        }
      },
      measuredPolygon: {
        component: IconBase,
        props: {
          iconName: "measuredPolygon"
          // iconFile: "/icons/iconMeasuredPolygonPaths.svg",
          // emphasizeTypes: [
          //   ["point", "front"],
          //   ["angleMarker", "back", "front"]
          // ]
        }
      },
      midpoint: {
        component: IconBase,
        props: {
          iconName: "midpoint"
          // iconFile: "/icons/iconMidpointPaths.svg",
          // emphasizeTypes: [
          //   ["segment", "front"],
          //   ["point", "front"]
          // ]
        }
      },
      nSectPoint: {
        component: IconBase,
        props: {
          iconName: "nSectPoint"
          // iconFile: "/icons/iconNSectPointPaths.svg",
          // emphasizeTypes: [
          //   ["segment", "front"],
          //   ["point", "front"]
          // ]
        }
      },
      angleBisector: {
        component: IconBase,
        props: {
          iconName: "angleBisector"
          // iconFile: "/icons/iconAngleBisectorPaths.svg",
          // emphasizeTypes: [
          //   ["line", "front", "back"],
          //   ["angleMarker", "front"]
          // ]
        }
      },
      nSectLine: {
        component: IconBase,
        props: {
          iconName: "nSectLine"
          // iconFile: "/icons/iconNSectLinePaths.svg",
          // emphasizeTypes: [
          //   ["line", "front", "back"],
          //   ["angleMarker", "front"]
          // ]
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
