import { ToolButtonGroup } from "@/types";
import {toolDictionary} from "@/components/tooldictionary";

export const toolGroups: Array<ToolButtonGroup> = [
  /* Note: the group names below must match the identifier of
     toolgroups.XXXXXX defined in the I18N translation files */
  {
    group: "EditTools",
    children: [  toolDictionary.get("select")!, toolDictionary.get("delete")! ]
  },
  {
    group: "DisplayTools",
    children: [
      {
        id: 0,
        actionModeValue: "hide",
        displayedName: "HideDisplayedName",
        icon: "$vuetify.icons.value.hide",
        toolTipMessage: "HideObjectToolTipMessage",
        toolUseMessage: "HideObjectToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 5,
        actionModeValue: "toggleLabelDisplay",
        displayedName: "ToggleLabelDisplayedName",
        icon: "$vuetify.icons.value.toggleLabelDisplay",
        toolTipMessage: "ToggleLabelToolTipMessage",
        toolUseMessage: "ToggleLabelToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },

      {
        id: 15,
        actionModeValue: "move",
        displayedName: "MoveDisplayedName",
        icon: "$vuetify.icons.value.move",
        toolTipMessage: "MoveObjectToolTipMessage",
        toolUseMessage: "MoveObjectToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 20,
        actionModeValue: "rotate",
        displayedName: "RotateDisplayedName",
        icon: "$vuetify.icons.value.rotate",
        toolTipMessage: "RotateSphereToolTipMessage",
        toolUseMessage: "RotateSphereToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 25,
        actionModeValue: "zoomIn",
        displayedName: "PanZoomInDisplayedName",
        icon: "$vuetify.icons.value.zoomIn",
        toolTipMessage: "PanZoomInToolTipMessage",
        toolUseMessage: "PanZoomInToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 30,
        actionModeValue: "zoomOut",
        displayedName: "PanZoomOutDisplayedName",
        icon: "$vuetify.icons.value.zoomOut",
        toolTipMessage: "PanZoomOutToolTipMessage",
        toolUseMessage: "PanZoomOutToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 35,
        actionModeValue: "zoomFit",
        displayedName: "ZoomFitDisplayedName",
        icon: "$vuetify.icons.value.zoomFit",
        toolTipMessage: "ZoomFitToolTipMessage",
        toolUseMessage: "ZoomFitToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      }
    ]
  },
  {
    group: "BasicTools",
    children: [
      {
        id: 0,
        actionModeValue: "point",
        displayedName: "CreatePointDisplayedName",
        icon: "$vuetify.icons.value.point",
        toolTipMessage: "CreatePointToolTipMessage",
        toolUseMessage: "CreatePointToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 5,
        actionModeValue: "line",
        displayedName: "CreateLineDisplayedName",
        icon: "$vuetify.icons.value.line",
        toolTipMessage: "CreateLineToolTipMessage",
        toolUseMessage: "CreateLineToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 10,
        actionModeValue: "segment",
        displayedName: "CreateLineSegmentDisplayedName",
        icon: "$vuetify.icons.value.segment",
        toolTipMessage: "CreateLineSegmentToolTipMessage",
        toolUseMessage: "CreateLineSegmentToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 20,
        actionModeValue: "circle",
        displayedName: "CreateCircleDisplayedName",
        icon: "$vuetify.icons.value.circle",
        toolTipMessage: "CreateCircleToolTipMessage",
        toolUseMessage: "CreateCircleToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      }
    ]
  },
  {
    group: "ConstructionTools",
    children: [
      {
        id: 0,
        actionModeValue: "antipodalPoint",
        displayedName: "CreateAntipodalPointDisplayedName",
        icon: "$vuetify.icons.value.antipodalPoint",
        toolTipMessage: "CreateAntipodalPointToolTipMessage",
        toolUseMessage: "CreateAntipodalPointToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 5,
        actionModeValue: "polar",
        displayedName: "CreatePolarDisplayedName",
        icon: "$vuetify.icons.value.polar",
        toolTipMessage: "CreatePolarToolTipMessage",
        toolUseMessage: "CreatePolarToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 10,
        actionModeValue: "midpoint",
        displayedName: "CreateMidpointDisplayedName",
        icon: "$vuetify.icons.value.midpoint",
        toolTipMessage: "CreateMidpointToolTipMessage",
        toolUseMessage: "CreateMidpointToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 15,
        actionModeValue: "angleBisector",
        displayedName: "CreateAngleBisectorDisplayedName",
        icon: "$vuetify.icons.value.angleBisector",
        toolTipMessage: "CreateAngleBisectorToolTipMessage",
        toolUseMessage: "CreateAngleBisectorToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },

      {
        id: 20,
        actionModeValue: "tangent",
        displayedName: "CreateTangentDisplayedName",
        icon: "$vuetify.icons.value.tangent",
        toolTipMessage: "CreateTangentToolTipMessage",
        toolUseMessage: "CreateTangentToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 25,
        actionModeValue: "perpendicular",
        displayedName: "CreatePerpendicularDisplayedName",
        icon: "$vuetify.icons.value.perpendicular",
        toolTipMessage: "CreatePerpendicularToolTipMessage",
        toolUseMessage: "CreatePerpendicularToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 30,
        actionModeValue: "intersect",
        displayedName: "CreateIntersectionDisplayedName",
        icon: "$vuetify.icons.value.intersect",
        toolTipMessage: "CreateIntersectionToolTipMessage",
        toolUseMessage: "CreateIntersectionToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 55,
        actionModeValue: "pointOnObject",
        displayedName: "CreatePointOnOneDimDisplayedName",
        icon: "$vuetify.icons.value.pointOnObject",
        toolTipMessage: "CreatePointOnOneDimToolTipMessage",
        toolUseMessage: "CreatePointOnOneDimToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      }
    ]
  },
  {
    group: "MeasurementTools",
    children: [
      {
        id: 0,
        actionModeValue: "angle",
        displayedName: "CreateAngleDisplayedName",
        icon: "$vuetify.icons.value.angle",
        toolTipMessage: "CreateAngleToolTipMessage",
        toolUseMessage: "CreateAngleToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 5,
        actionModeValue: "pointDistance",
        displayedName: "CreatePointDistanceDisplayedName",
        icon: "$vuetify.icons.value.pointDistance",
        toolTipMessage: "CreatePointDistanceToolTipMessage",
        toolUseMessage: "CreatePointDistanceToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 10,
        actionModeValue: "segmentLength",
        displayedName: "CreateSegmentLengthDisplayedName",
        icon: "$vuetify.icons.value.segmentLength",
        toolTipMessage: "CreateSegmentLengthToolTipMessage",
        toolUseMessage: "CreateSegmentLengthToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 15,
        actionModeValue: "coordinate",
        displayedName: "CreateCoordinateDisplayedName",
        icon: "$vuetify.icons.value.coordinate",
        toolTipMessage: "CreateCoordinateToolTipMessage",
        toolUseMessage: "CreateCoordinateToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 20,
        actionModeValue: "measureTriangle",
        displayedName: "MeasureTriangleDisplayedName",
        icon: "$vuetify.icons.value.measureTriangle",
        toolTipMessage: "MeasureTriangleToolTipMessage",
        toolUseMessage: "MeasureTriangleToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 25,
        actionModeValue: "measurePolygon",
        displayedName: "MeasurePolygonDisplayedName",
        icon: "$vuetify.icons.value.measurePolygon",
        toolTipMessage: "MeasurePolygonToolTipMessage",
        toolUseMessage: "MeasurePolygonToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      }
    ]
  },
  {
    group: "ConicTools",
    children: [
      {
        id: 0,
        actionModeValue: "ellipse",
        displayedName: "CreateEllipseDisplayedName",
        icon: "$vuetify.icons.value.ellipse",
        toolTipMessage: "CreateEllipseToolTipMessage",
        toolUseMessage: "CreateEllipseToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      }
    ]
  },
  {
    group: "AdvancedTools",
    children: [
      {
        id: 0,
        actionModeValue: "threePointCircle",
        displayedName: "CreateThreePointCircleDisplayedName",
        icon: "$vuetify.icons.value.threePointCircle",
        toolTipMessage: "CreateThreePointCircleToolTipMessage",
        toolUseMessage: "CreateThreePointCircleToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 10,
        actionModeValue: "nSectPoint",
        displayedName: "CreateNSectSegmentDisplayedName",
        icon: "$vuetify.icons.value.nSectPoint",
        toolTipMessage: "CreateNSectSegmentToolTipMessage",
        toolUseMessage: "CreateNSectSegmentToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 15,
        actionModeValue: "nSectLine",
        displayedName: "CreateNSectAngleDisplayedName",
        icon: "$vuetify.icons.value.nSectLine",
        toolTipMessage: "CreateNSectAngleToolTipMessage",
        toolUseMessage: "CreateNSectAngleToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      }
    ]
  },
  {
    group: "TransformationTools",
    children: [
      {
        id: 0,
        actionModeValue: "pointReflection",
        displayedName: "CreatePointReflectionDisplayedName",
        icon: "$vuetify.icons.value.pointReflection",
        toolTipMessage: "CreatePointReflectionToolTipMessage",
        toolUseMessage: "CreatePointReflectionToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 5,
        actionModeValue: "reflection",
        displayedName: "CreateReflectionDisplayedName",
        icon: "$vuetify.icons.value.reflection",
        toolTipMessage: "CreateReflectionToolTipMessage",
        toolUseMessage: "CreateReflectionToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 10,
        actionModeValue: "rotation",
        displayedName: "CreateRotationDisplayedName",
        icon: "$vuetify.icons.value.rotation",
        toolTipMessage: "CreateRotationToolTipMessage",
        toolUseMessage: "CreateRotationToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 15,
        actionModeValue: "translation",
        displayedName: "CreateTranslationDisplayedName",
        icon: "$vuetify.icons.value.translation",
        toolTipMessage: "CreateTranslationToolTipMessage",
        toolUseMessage: "CreateTranslationToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 20,
        actionModeValue: "inversion",
        displayedName: "CreateInversionDisplayedName",
        icon: "$vuetify.icons.value.inversion",
        toolTipMessage: "CreateInversionToolTipMessage",
        toolUseMessage: "CreateInversionToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      },
      {
        id: 25,
        actionModeValue: "applyTransformation",
        displayedName: "ApplyTransformationDisplayedName",
        icon: "$vuetify.icons.value.applyTransformation",
        toolTipMessage: "ApplyTransformationToolTipMessage",
        toolUseMessage: "ApplyTransformationToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      }
    ]
  },
  {
    group: "MeasuredObjectTools",
    children: [
      {
        id: 15,
        actionModeValue: "measuredCircle",
        displayedName: "CreateMeasuredCircleDisplayedName",
        icon: "$vuetify.icons.value.measuredCircle",
        toolTipMessage: "CreateMeasuredCircleToolTipMessage",
        toolUseMessage: "CreateMeasuredCircleToolUseMessage",
        displayToolUseMessage: false,
        disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
      }
    ]
  }
];
