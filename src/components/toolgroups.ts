import { ToolButtonGroup } from "@/types";

export const toolGroups: Array<ToolButtonGroup> = [
  /* Note: the group names below must match the identifier of
     toolgroups.XXXXXX defined in the I18N translation files */
  {
    group: "EditTools",
    children: [
      {
        id: 0,
        action: "select",
        displayedName: "SelectDisplayedName",
        icon: "$select",
        toolTipMessage: "SelectToolTipMessage",
        toolUseMessage: "SelectToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 5,
        action: "delete",
        displayedName: "DeleteDisplayedName",
        icon: "$delete",
        toolTipMessage: "DeleteToolTipMessage",
        toolUseMessage: "DeleteToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 25,
        action: "zoomIn",
        displayedName: "PanZoomInDisplayedName",
        icon: "$zoomIn",
        toolTipMessage: "PanZoomInToolTipMessage",
        toolUseMessage: "PanZoomInToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 30,
        action: "zoomOut",
        displayedName: "PanZoomOutDisplayedName",
        icon: "$zoomOut",
        toolTipMessage: "PanZoomOutToolTipMessage",
        toolUseMessage: "PanZoomOutToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 35,
        action: "zoomFit",
        displayedName: "ZoomFitDisplayedName",
        icon: "$zoomFit",
        toolTipMessage: "ZoomFitToolTipMessage",
        toolUseMessage: "ZoomFitToolUseMessage",
        displayToolUseMessage: false
      }
    ]
  },
  {
    group: "DisplayTools",
    children: [
      {
        id: 0,
        action: "hide",
        displayedName: "HideDisplayedName",
        icon: "$hide",
        toolTipMessage: "HideObjectToolTipMessage",
        toolUseMessage: "HideObjectToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 5,
        action: "toggleLabelDisplay",
        displayedName: "ToggleLabelDisplayedName",
        icon: "$toggleLabelDisplay",
        toolTipMessage: "ToggleLabelToolTipMessage",
        toolUseMessage: "ToggleLabelToolUseMessage",
        displayToolUseMessage: false
      },

      {
        id: 15,
        action: "move",
        displayedName: "MoveDisplayedName",
        icon: "$move",
        toolTipMessage: "MoveObjectToolTipMessage",
        toolUseMessage: "MoveObjectToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 20,
        action: "rotate",
        displayedName: "RotateDisplayedName",
        icon: "$rotate",
        toolTipMessage: "RotateSphereToolTipMessage",
        toolUseMessage: "RotateSphereToolUseMessage",
        displayToolUseMessage: false
      }
    ]
  },
  {
    group: "BasicTools",
    children: [
      {
        id: 0,
        action: "point",
        displayedName: "CreatePointDisplayedName",
        icon: "$point",
        toolTipMessage: "CreatePointToolTipMessage",
        toolUseMessage: "CreatePointToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 5,
        action: "line",
        displayedName: "CreateLineDisplayedName",
        icon: "$line",
        toolTipMessage: "CreateLineToolTipMessage",
        toolUseMessage: "CreateLineToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 10,
        action: "segment",
        displayedName: "CreateLineSegmentDisplayedName",
        icon: "$segment",
        toolTipMessage: "CreateLineSegmentToolTipMessage",
        toolUseMessage: "CreateLineSegmentToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 20,
        action: "circle",
        displayedName: "CreateCircleDisplayedName",
        icon: "$circle",
        toolTipMessage: "CreateCircleToolTipMessage",
        toolUseMessage: "CreateCircleToolUseMessage",
        displayToolUseMessage: false
      }
    ]
  },
  {
    group: "ConstructionTools",
    children: [
      {
        id: 0,
        action: "midpoint",
        displayedName: "CreateMidpointDisplayedName",
        icon: "$midpoint",
        toolTipMessage: "CreateMidpointToolTipMessage",
        toolUseMessage: "CreateMidpointToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 5,
        action: "angleBisector",
        displayedName: "CreateAngleBisectorDisplayedName",
        icon: "$angleBisector",
        toolTipMessage: "CreateAngleBisectorToolTipMessage",
        toolUseMessage: "CreateAngleBisectorToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 15,
        action: "antipodalPoint",
        displayedName: "CreateAntipodalPointDisplayedName",
        icon: "$antipodalPoint",
        toolTipMessage: "CreateAntipodalPointToolTipMessage",
        toolUseMessage: "CreateAntipodalPointToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 20,
        action: "polar",
        displayedName: "CreatePolarDisplayedName",
        icon: "$polar",
        toolTipMessage: "CreatePolarToolTipMessage",
        toolUseMessage: "CreatePolarToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 25,
        action: "tangent",
        displayedName: "CreateTangentDisplayedName",
        icon: "$tangent",
        toolTipMessage: "CreateTangentToolTipMessage",
        toolUseMessage: "CreateTangentToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 30,
        action: "perpendicular",
        displayedName: "CreatePerpendicularDisplayedName",
        icon: "$perpendicular",
        toolTipMessage: "CreatePerpendicularToolTipMessage",
        toolUseMessage: "CreatePerpendicularToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 50,
        action: "intersect",
        displayedName: "CreateIntersectionDisplayedName",
        icon: "$intersect",
        toolTipMessage: "CreateIntersectionToolTipMessage",
        toolUseMessage: "CreateIntersectionToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 45,
        action: "pointOnObject",
        displayedName: "CreatePointOnOneDimDisplayedName",
        icon: "$pointOnObject",
        toolTipMessage: "CreatePointOnOneDimToolTipMessage",
        toolUseMessage: "CreatePointOnOneDimToolUseMessage",
        displayToolUseMessage: false
      }
    ]
  },
  {
    group: "MeasurementTools",
    children: [
      {
        id: 0,
        action: "segmentLength",
        displayedName: "CreateSegmentLengthDisplayedName",
        icon: "$segmentLength",
        toolTipMessage: "CreateSegmentLengthToolTipMessage",
        toolUseMessage: "CreateSegmentLengthToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 5,
        action: "pointDistance",
        displayedName: "CreatePointDistanceDisplayedName",
        icon: "$pointDistance",
        toolTipMessage: "CreatePointDistanceToolTipMessage",
        toolUseMessage: "CreatePointDistanceToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 10,
        action: "angle",
        displayedName: "CreateAngleDisplayedName",
        icon: "$angle",
        toolTipMessage: "CreateAngleToolTipMessage",
        toolUseMessage: "CreateAngleToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 15,
        action: "coordinate",
        displayedName: "CreateCoordinateDisplayedName",
        icon: "$coordinate",
        toolTipMessage: "CreateCoordinateToolTipMessage",
        toolUseMessage: "CreateCoordinateToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 20,
        action: "measureTriangle",
        displayedName: "MeasureTriangleDisplayedName",
        icon: "$measureTriangle",
        toolTipMessage: "MeasureTriangleToolTipMessage",
        toolUseMessage: "MeasureTriangleToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 25,
        action: "measurePolygon",
        displayedName: "MeasurePolygonDisplayedName",
        icon: "$measurePolygon",
        toolTipMessage: "MeasurePolygonToolTipMessage",
        toolUseMessage: "MeasurePolygonToolUseMessage",
        displayToolUseMessage: false
      }
    ]
  },
  {
    group: "ConicTools",
    children: [
      {
        id: 0,
        action: "ellipse",
        displayedName: "CreateEllipseDisplayedName",
        icon: "$ellipse",
        toolTipMessage: "CreateEllipseToolTipMessage",
        toolUseMessage: "CreateEllipseToolUseMessage",
        displayToolUseMessage: false
      }
    ]
  },
  {
    group: "AdvancedTools",
    children: [
      {
        id: 10,
        action: "nSectPoint",
        displayedName: "CreateNSectSegmentDisplayedName",
        icon: "$nSectPoint",
        toolTipMessage: "CreateNSectSegmentToolTipMessage",
        toolUseMessage: "CreateNSectSegmentToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 15,
        action: "nSectLine",
        displayedName: "CreateNSectAngleDisplayedName",
        icon: "$nSectLine",
        toolTipMessage: "CreateNSectAngleToolTipMessage",
        toolUseMessage: "CreateNSectAngleToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 20,
        action: "threePointCircle",
        displayedName: "CreateThreePointCircleDisplayedName",
        icon: "$threePointCircle",
        toolTipMessage: "CreateThreePointCircleToolTipMessage",
        toolUseMessage: "CreateThreePointCircleToolUseMessage",
        displayToolUseMessage: false
      }
    ]
  },
  {
    group: "TransformationTools",
    children: [
      {
        id: 0,
        action: "pointReflection",
        displayedName: "CreatePointReflectionDisplayedName",
        icon: "$pointReflection",
        toolTipMessage: "CreatePointReflectionToolTipMessage",
        toolUseMessage: "CreatePointReflectionToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 5,
        action: "reflection",
        displayedName: "CreateReflectionDisplayedName",
        icon: "$reflection",
        toolTipMessage: "CreateReflectionToolTipMessage",
        toolUseMessage: "CreateReflectionToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 10,
        action: "rotation",
        displayedName: "CreateRotationDisplayedName",
        icon: "$rotation",
        toolTipMessage: "CreateRotationToolTipMessage",
        toolUseMessage: "CreateRotationToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 15,
        action: "translation",
        displayedName: "CreateTranslationDisplayedName",
        icon: "$translation",
        toolTipMessage: "CreateTranslationToolTipMessage",
        toolUseMessage: "CreateTranslationToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 20,
        action: "inversion",
        displayedName: "CreateInversionDisplayedName",
        icon: "$inversion",
        toolTipMessage: "CreateInversionToolTipMessage",
        toolUseMessage: "CreateInversionToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 25,
        action: "applyTransformation",
        displayedName: "ApplyTransformationDisplayedName",
        icon: "$applyTransformation",
        toolTipMessage: "ApplyTransformationToolTipMessage",
        toolUseMessage: "ApplyTransformationToolUseMessage",
        displayToolUseMessage: false
      }
    ]
  },
  {
    group: "MeasuredObjectTools",
    children: [
      {
        id: 15,
        action: "measuredCircle",
        displayedName: "CreateMeasuredCircleDisplayedName",
        icon: "$measuredCircle",
        toolTipMessage: "CreateMeasuredCircleToolTipMessage",
        toolUseMessage: "CreateMeasuredCircleToolUseMessage",
        displayToolUseMessage: false
      }
    ]
  }
];
