import { ToolButtonGroup } from "@/types";

export const toolGroups: Array<ToolButtonGroup> = [
  /* Note: the group names below must match the identifier of
     toolgroups.XXXXXX defined in the I18N translation files */
  {
    group: "EditTools",
    children: [
      {
        id: 0,
        actionModeValue: "select",
        displayedName: "SelectDisplayedName",
        icon: "$select",
        toolTipMessage: "SelectToolTipMessage",
        toolUseMessage: "SelectToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 5,
        actionModeValue: "delete",
        displayedName: "DeleteDisplayedName",
        icon: "$delete",
        toolTipMessage: "DeleteToolTipMessage",
        toolUseMessage: "DeleteToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 25,
        actionModeValue: "zoomIn",
        displayedName: "PanZoomInDisplayedName",
        icon: "$zoomIn",
        toolTipMessage: "PanZoomInToolTipMessage",
        toolUseMessage: "PanZoomInToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 30,
        actionModeValue: "zoomOut",
        displayedName: "PanZoomOutDisplayedName",
        icon: "$zoomOut",
        toolTipMessage: "PanZoomOutToolTipMessage",
        toolUseMessage: "PanZoomOutToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 35,
        actionModeValue: "zoomFit",
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
        actionModeValue: "hide",
        displayedName: "HideDisplayedName",
        icon: "$hide",
        toolTipMessage: "HideObjectToolTipMessage",
        toolUseMessage: "HideObjectToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 5,
        actionModeValue: "toggleLabelDisplay",
        displayedName: "ToggleLabelDisplayedName",
        icon: "$toggleLabelDisplay",
        toolTipMessage: "ToggleLabelToolTipMessage",
        toolUseMessage: "ToggleLabelToolUseMessage",
        displayToolUseMessage: false
      },

      {
        id: 15,
        actionModeValue: "move",
        displayedName: "MoveDisplayedName",
        icon: "$move",
        toolTipMessage: "MoveObjectToolTipMessage",
        toolUseMessage: "MoveObjectToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 20,
        actionModeValue: "rotate",
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
        actionModeValue: "point",
        displayedName: "CreatePointDisplayedName",
        icon: "$point",
        toolTipMessage: "CreatePointToolTipMessage",
        toolUseMessage: "CreatePointToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 5,
        actionModeValue: "line",
        displayedName: "CreateLineDisplayedName",
        icon: "$line",
        toolTipMessage: "CreateLineToolTipMessage",
        toolUseMessage: "CreateLineToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 10,
        actionModeValue: "segment",
        displayedName: "CreateLineSegmentDisplayedName",
        icon: "$segment",
        toolTipMessage: "CreateLineSegmentToolTipMessage",
        toolUseMessage: "CreateLineSegmentToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 20,
        actionModeValue: "circle",
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
        actionModeValue: "midpoint",
        displayedName: "CreateMidpointDisplayedName",
        icon: "$midpoint",
        toolTipMessage: "CreateMidpointToolTipMessage",
        toolUseMessage: "CreateMidpointToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 5,
        actionModeValue: "angleBisector",
        displayedName: "CreateAngleBisectorDisplayedName",
        icon: "$angleBisector",
        toolTipMessage: "CreateAngleBisectorToolTipMessage",
        toolUseMessage: "CreateAngleBisectorToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 15,
        actionModeValue: "antipodalPoint",
        displayedName: "CreateAntipodalPointDisplayedName",
        icon: "$antipodalPoint",
        toolTipMessage: "CreateAntipodalPointToolTipMessage",
        toolUseMessage: "CreateAntipodalPointToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 20,
        actionModeValue: "polar",
        displayedName: "CreatePolarDisplayedName",
        icon: "$polar",
        toolTipMessage: "CreatePolarToolTipMessage",
        toolUseMessage: "CreatePolarToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 25,
        actionModeValue: "tangent",
        displayedName: "CreateTangentDisplayedName",
        icon: "$tangent",
        toolTipMessage: "CreateTangentToolTipMessage",
        toolUseMessage: "CreateTangentToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 30,
        actionModeValue: "perpendicular",
        displayedName: "CreatePerpendicularDisplayedName",
        icon: "$perpendicular",
        toolTipMessage: "CreatePerpendicularToolTipMessage",
        toolUseMessage: "CreatePerpendicularToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 50,
        actionModeValue: "intersect",
        displayedName: "CreateIntersectionDisplayedName",
        icon: "$intersect",
        toolTipMessage: "CreateIntersectionToolTipMessage",
        toolUseMessage: "CreateIntersectionToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 45,
        actionModeValue: "pointOnObject",
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
        actionModeValue: "segmentLength",
        displayedName: "CreateSegmentLengthDisplayedName",
        icon: "$segmentLength",
        toolTipMessage: "CreateSegmentLengthToolTipMessage",
        toolUseMessage: "CreateSegmentLengthToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 5,
        actionModeValue: "pointDistance",
        displayedName: "CreatePointDistanceDisplayedName",
        icon: "$pointDistance",
        toolTipMessage: "CreatePointDistanceToolTipMessage",
        toolUseMessage: "CreatePointDistanceToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 10,
        actionModeValue: "angle",
        displayedName: "CreateAngleDisplayedName",
        icon: "$angle",
        toolTipMessage: "CreateAngleToolTipMessage",
        toolUseMessage: "CreateAngleToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 15,
        actionModeValue: "coordinate",
        displayedName: "CreateCoordinateDisplayedName",
        icon: "$coordinate",
        toolTipMessage: "CreateCoordinateToolTipMessage",
        toolUseMessage: "CreateCoordinateToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 20,
        actionModeValue: "measureTriangle",
        displayedName: "MeasureTriangleDisplayedName",
        icon: "$measureTriangle",
        toolTipMessage: "MeasureTriangleToolTipMessage",
        toolUseMessage: "MeasureTriangleToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 25,
        actionModeValue: "measurePolygon",
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
        actionModeValue: "ellipse",
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
        actionModeValue: "nSectPoint",
        displayedName: "CreateNSectSegmentDisplayedName",
        icon: "$nSectPoint",
        toolTipMessage: "CreateNSectSegmentToolTipMessage",
        toolUseMessage: "CreateNSectSegmentToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 15,
        actionModeValue: "nSectLine",
        displayedName: "CreateNSectAngleDisplayedName",
        icon: "$nSectLine",
        toolTipMessage: "CreateNSectAngleToolTipMessage",
        toolUseMessage: "CreateNSectAngleToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 20,
        actionModeValue: "threePointCircle",
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
        actionModeValue: "pointReflection",
        displayedName: "CreatePointReflectionDisplayedName",
        icon: "$pointReflection",
        toolTipMessage: "CreatePointReflectionToolTipMessage",
        toolUseMessage: "CreatePointReflectionToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 5,
        actionModeValue: "reflection",
        displayedName: "CreateReflectionDisplayedName",
        icon: "$reflection",
        toolTipMessage: "CreateReflectionToolTipMessage",
        toolUseMessage: "CreateReflectionToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 10,
        actionModeValue: "rotation",
        displayedName: "CreateRotationDisplayedName",
        icon: "$rotation",
        toolTipMessage: "CreateRotationToolTipMessage",
        toolUseMessage: "CreateRotationToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 15,
        actionModeValue: "translation",
        displayedName: "CreateTranslationDisplayedName",
        icon: "$translation",
        toolTipMessage: "CreateTranslationToolTipMessage",
        toolUseMessage: "CreateTranslationToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 20,
        actionModeValue: "inversion",
        displayedName: "CreateInversionDisplayedName",
        icon: "$inversion",
        toolTipMessage: "CreateInversionToolTipMessage",
        toolUseMessage: "CreateInversionToolUseMessage",
        displayToolUseMessage: false
      },
      {
        id: 25,
        actionModeValue: "applyTransformation",
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
        actionModeValue: "measuredCircle",
        displayedName: "CreateMeasuredCircleDisplayedName",
        icon: "$measuredCircle",
        toolTipMessage: "CreateMeasuredCircleToolTipMessage",
        toolUseMessage: "CreateMeasuredCircleToolUseMessage",
        displayToolUseMessage: false
      }
    ]
  }
];
