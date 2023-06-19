import { ActionMode, ToolButtonType } from "@/types";
import { Command } from "@/commands/Command";
import EventBus from "@/eventHandlers/EventBus";

// Note: when adding a new tool, will also need to add a new case in SphereFrame.vue switchActionMode()
export const TOOL_DICTIONARY: Map<ActionMode, ToolButtonType> = new Map();

/* The first three are default shortcut icons with special actions */
TOOL_DICTIONARY
  .set("undoAction", {
    id: 0,
    action: "undoAction",
    displayedName: "UndoLastActionDisplayedName",
    icon: "mdi-undo",
    toolTipMessage: "UndoLastActionToolTipMessage",
    toolUseMessage: "UndoLastActionToolUseMessage",
    //displayToolUseMessage: false,
    //disableIcon: "$blank",
    clickFunc: () => {
      // These have a clickFunc because the functions used to be statically defined in Easel.vue
      Command.undo();
    }
  })
  .set("redoAction", {
    id: 5,
    action: "redoAction",
    displayedName: "RedoLastActionDisplayedName",
    icon: "mdi-redo",
    toolTipMessage: "RedoLastActionToolTipMessage",
    toolUseMessage: "RedoLastActionToolUseMessage",
    //displayToolUseMessage: false,
    //disableIcon: "$blank",
    clickFunc: () => {
      Command.redo();
    }
  })
  .set("resetAction", {
    id: 10,
    action: "resetAction",
    displayedName: "ResetSphereActionDisplayedName",
    icon: "mdi-broom",
    toolTipMessage: "ResetSphereActionToolTipMessage",
    toolUseMessage: "ResetSphereActionToolUseMessage",
    //displayToolUseMessage: false,
    //disableIcon: "$blank",
    clickFunc: () => {
      EventBus.fire("display-clear-construction-dialog-box", {});
    }
  });

TOOL_DICTIONARY.set("select", {
  id: 0,
  action: "select",
  displayedName: "SelectDisplayedName",
  // icon: "$select",
  toolGroup: "EditTools",
  toolTipMessage: "SelectToolTipMessage",
  toolUseMessage: "SelectToolUseMessage"
  //displayToolUseMessage: false,
  //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
}).set("delete", {
  id: 5,
  action: "delete",
  displayedName: "DeleteDisplayedName",
  // icon: "$delete",
  toolGroup: "EditTools",
  toolTipMessage: "DeleteToolTipMessage",
  toolUseMessage: "DeleteToolUseMessage"
  //displayToolUseMessage: false,
  //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
  .set("hide", {
    id: 0,
    action: "hide",
    displayedName: "HideDisplayedName",
    // icon: "$hide",
    toolGroup: "DisplayTools",
    toolTipMessage: "HideObjectToolTipMessage",
    toolUseMessage: "HideObjectToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("toggleLabelDisplay", {
    id: 5,
    action: "toggleLabelDisplay",
    displayedName: "ToggleLabelDisplayedName",
    //icon: "$toggleLabelDisplay",
    toolGroup: "DisplayTools",
    toolTipMessage: "ToggleLabelToolTipMessage",
    toolUseMessage: "ToggleLabelToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("move", {
    id: 15,
    action: "move",
    displayedName: "MoveDisplayedName",
    //icon: "$move",
    toolGroup: "DisplayTools",
    toolTipMessage: "MoveObjectToolTipMessage",
    toolUseMessage: "MoveObjectToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("rotate", {
    id: 20,
    action: "rotate",
    displayedName: "RotateDisplayedName",
    //icon: "$rotate",
    toolGroup: "DisplayTools",
    toolTipMessage: "RotateSphereToolTipMessage",
    toolUseMessage: "RotateSphereToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("zoomIn", {
    id: 25,
    action: "zoomIn",
    displayedName: "PanZoomInDisplayedName",
    //icon: "$zoomIn",
    toolGroup: "DisplayTools",
    toolTipMessage: "PanZoomInToolTipMessage",
    toolUseMessage: "PanZoomInToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("zoomOut", {
    id: 30,
    action: "zoomOut",
    displayedName: "PanZoomOutDisplayedName",
    //icon: "$zoomOut",
    toolGroup: "DisplayTools",
    toolTipMessage: "PanZoomOutToolTipMessage",
    toolUseMessage: "PanZoomOutToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("zoomFit", {
    id: 35,
    action: "zoomFit",
    displayedName: "ZoomFitDisplayedName",
    //icon: "$zoomFit",
    toolGroup: "DisplayTools",
    toolTipMessage: "ZoomFitToolTipMessage",
    toolUseMessage: "ZoomFitToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("point", {
    id: 0,
    action: "point",
    displayedName: "CreatePointDisplayedName",
    //icon: "$point",
    toolGroup: "BasicTools",
    toolTipMessage: "CreatePointToolTipMessage",
    toolUseMessage: "CreatePointToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("line", {
    id: 5,
    action: "line",
    displayedName: "CreateLineDisplayedName",
    //icon: "$line",
    toolGroup: "BasicTools",
    toolTipMessage: "CreateLineToolTipMessage",
    toolUseMessage: "CreateLineToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("segment", {
    id: 10,
    action: "segment",
    displayedName: "CreateLineSegmentDisplayedName",
    //icon: "$segment",
    toolGroup: "BasicTools",
    toolTipMessage: "CreateLineSegmentToolTipMessage",
    toolUseMessage: "CreateLineSegmentToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("circle", {
    id: 20,
    action: "circle",
    displayedName: "CreateCircleDisplayedName",
    //icon: "$circle",
    toolGroup: "BasicTools",
    toolTipMessage: "CreateCircleToolTipMessage",
    toolUseMessage: "CreateCircleToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("antipodalPoint", {
    id: 0,
    action: "antipodalPoint",
    displayedName: "CreateAntipodalPointDisplayedName",
    //icon: "$antipodalPoint",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreateAntipodalPointToolTipMessage",
    toolUseMessage: "CreateAntipodalPointToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("polar", {
    id: 5,
    action: "polar",
    displayedName: "CreatePolarDisplayedName",
    //icon: "$polar",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreatePolarToolTipMessage",
    toolUseMessage: "CreatePolarToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("midpoint", {
    id: 10,
    action: "midpoint",
    displayedName: "CreateMidpointDisplayedName",
    //icon: "$midpoint",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreateMidpointToolTipMessage",
    toolUseMessage: "CreateMidpointToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("angleBisector", {
    id: 15,
    action: "angleBisector",
    displayedName: "CreateAngleBisectorDisplayedName",
    //icon: "$angleBisector",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreateAngleBisectorToolTipMessage",
    toolUseMessage: "CreateAngleBisectorToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("tangent", {
    id: 20,
    action: "tangent",
    displayedName: "CreateTangentDisplayedName",
    //icon: "$tangent",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreateTangentToolTipMessage",
    toolUseMessage: "CreateTangentToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("perpendicular", {
    id: 25,
    action: "perpendicular",
    displayedName: "CreatePerpendicularDisplayedName",
    //icon: "$perpendicular",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreatePerpendicularToolTipMessage",
    toolUseMessage: "CreatePerpendicularToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("intersect", {
    id: 30,
    action: "intersect",
    displayedName: "CreateIntersectionDisplayedName",
    //icon: "$intersect",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreateIntersectionToolTipMessage",
    toolUseMessage: "CreateIntersectionToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("pointOnObject", {
    id: 55,
    action: "pointOnObject",
    displayedName: "CreatePointOnOneDimDisplayedName",
    //icon: "$pointOnObject",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreatePointOnOneDimToolTipMessage",
    toolUseMessage: "CreatePointOnOneDimToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("angle", {
    id: 0,
    action: "angle",
    displayedName: "CreateAngleDisplayedName",
    //icon: "$angle",
    toolGroup: "MeasurementTools",
    toolTipMessage: "CreateAngleToolTipMessage",
    toolUseMessage: "CreateAngleToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("pointDistance", {
    id: 5,
    action: "pointDistance",
    displayedName: "CreatePointDistanceDisplayedName",
    //icon: "$pointDistance",
    toolGroup: "MeasurementTools",
    toolTipMessage: "CreatePointDistanceToolTipMessage",
    toolUseMessage: "CreatePointDistanceToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("segmentLength", {
    id: 10,
    action: "segmentLength",
    displayedName: "CreateSegmentLengthDisplayedName",
    //icon: "$segmentLength",
    toolGroup: "MeasurementTools",
    toolTipMessage: "CreateSegmentLengthToolTipMessage",
    toolUseMessage: "CreateSegmentLengthToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("coordinate", {
    id: 15,
    action: "coordinate",
    displayedName: "CreateCoordinateDisplayedName",
    //icon: "$coordinate",
    toolGroup: "MeasurementTools",
    toolTipMessage: "CreateCoordinateToolTipMessage",
    toolUseMessage: "CreateCoordinateToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("measureTriangle", {
    id: 20,
    action: "measureTriangle",
    displayedName: "MeasureTriangleDisplayedName",
    //icon: "$measureTriangle",
    toolGroup: "MeasurementTools",
    toolTipMessage: "MeasureTriangleToolTipMessage",
    toolUseMessage: "MeasureTriangleToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("measurePolygon", {
    id: 25,
    action: "measurePolygon",
    displayedName: "MeasurePolygonDisplayedName",
    //icon: "$measurePolygon",
    toolGroup: "MeasurementTools",
    toolTipMessage: "MeasurePolygonToolTipMessage",
    toolUseMessage: "MeasurePolygonToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("ellipse", {
    id: 0,
    action: "ellipse",
    displayedName: "CreateEllipseDisplayedName",
    //icon: "$ellipse",
    toolGroup: "ConicTools",
    toolTipMessage: "CreateEllipseToolTipMessage",
    toolUseMessage: "CreateEllipseToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("threePointCircle", {
    id: 0,
    action: "threePointCircle",
    displayedName: "CreateThreePointCircleDisplayedName",
    //icon: "$threePointCircle",
    toolGroup: "AdvancedTools",
    toolTipMessage: "CreateThreePointCircleToolTipMessage",
    toolUseMessage: "CreateThreePointCircleToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("nSectPoint", {
    id: 10,
    action: "nSectPoint",
    displayedName: "CreateNSectSegmentDisplayedName",
    //icon: "$nSectPoint",
    toolGroup: "AdvancedTools",
    toolTipMessage: "CreateNSectSegmentToolTipMessage",
    toolUseMessage: "CreateNSectSegmentToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("nSectLine", {
    id: 15,
    action: "nSectLine",
    displayedName: "CreateNSectAngleDisplayedName",
    //icon: "$nSectLine",
    toolGroup: "AdvancedTools",
    toolTipMessage: "CreateNSectAngleToolTipMessage",
    toolUseMessage: "CreateNSectAngleToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("pointReflection", {
    id: 0,
    action: "pointReflection",
    displayedName: "CreatePointReflectionDisplayedName",
    //icon: "$pointReflection",
    toolGroup: "TransformationTools",
    toolTipMessage: "CreatePointReflectionToolTipMessage",
    toolUseMessage: "CreatePointReflectionToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("reflection", {
    id: 5,
    action: "reflection",
    displayedName: "CreateReflectionDisplayedName",
    //icon: "$reflection",
    toolGroup: "TransformationTools",
    toolTipMessage: "CreateReflectionToolTipMessage",
    toolUseMessage: "CreateReflectionToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("rotation", {
    id: 10,
    action: "rotation",
    displayedName: "CreateRotationDisplayedName",
    //icon: "$rotation",
    toolGroup: "TransformationTools",
    toolTipMessage: "CreateRotationToolTipMessage",
    toolUseMessage: "CreateRotationToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("translation", {
    id: 15,
    action: "translation",
    displayedName: "CreateTranslationDisplayedName",
    //icon: "$translation",
    toolGroup: "TransformationTools",
    toolTipMessage: "CreateTranslationToolTipMessage",
    toolUseMessage: "CreateTranslationToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("inversion", {
    id: 20,
    action: "inversion",
    displayedName: "CreateInversionDisplayedName",
    //icon: "$inversion",
    toolGroup: "TransformationTools",
    toolTipMessage: "CreateInversionToolTipMessage",
    toolUseMessage: "CreateInversionToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("applyTransformation", {
    id: 25,
    action: "applyTransformation",
    displayedName: "ApplyTransformationDisplayedName",
    //icon: "$applyTransformation",
    toolGroup: "TransformationTools",
    toolTipMessage: "ApplyTransformationToolTipMessage",
    toolUseMessage: "ApplyTransformationToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("measuredCircle", {
    id: 15,
    action: "measuredCircle",
    displayedName: "CreateMeasuredCircleDisplayedName",
    //icon: "$measuredCircle",
    toolGroup: "MeasuredObjectTools",
    toolTipMessage: "CreateMeasuredCircleToolTipMessage",
    toolUseMessage: "CreateMeasuredCircleToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  });
