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
    displayedName: "buttons.UndoLastActionDisplayedName",
    icon: "mdi-undo",
    toolTipMessage: "buttons.UndoLastActionToolTipMessage",
    toolUseMessage: "buttons.UndoLastActionToolUseMessage",
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
    displayedName: "buttons.RedoLastActionDisplayedName",
    icon: "mdi-redo",
    toolTipMessage: "buttons.RedoLastActionToolTipMessage",
    toolUseMessage: "buttons.RedoLastActionToolUseMessage",
    //displayToolUseMessage: false,
    //disableIcon: "$blank",
    clickFunc: () => {
      Command.redo();
    }
  })
  .set("resetAction", {
    id: 10,
    action: "resetAction",
    displayedName: "buttons.ResetSphereActionDisplayedName",
    icon: "mdi-broom",
    toolTipMessage: "buttons.ResetSphereActionToolTipMessage",
    toolUseMessage: "buttons.ResetSphereActionToolUseMessage",
    //displayToolUseMessage: false,
    //disableIcon: "$blank",
    clickFunc: () => {
      EventBus.fire("display-clear-construction-dialog-box", {});
    }
  });

TOOL_DICTIONARY.set("select", {
  id: 0,
  action: "select",
  displayedName: "buttons.SelectDisplayedName",
  // icon: "$select",
  toolGroup: "EditTools",
  toolTipMessage: "buttons.SelectToolTipMessage",
  toolUseMessage: "buttons.SelectToolUseMessage"
  //displayToolUseMessage: false,
  //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
}).set("delete", {
  id: 5,
  action: "delete",
  displayedName: "buttons.DeleteDisplayedName",
  // icon: "$delete",
  toolGroup: "EditTools",
  toolTipMessage: "buttons.DeleteToolTipMessage",
  toolUseMessage: "buttons.DeleteToolUseMessage"
  //displayToolUseMessage: false,
  //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
  .set("hide", {
    id: 0,
    action: "hide",
    displayedName: "buttons.HideDisplayedName",
    // icon: "$hide",
    toolGroup: "DisplayTools",
    toolTipMessage: "buttons.HideObjectToolTipMessage",
    toolUseMessage: "buttons.HideObjectToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("toggleLabelDisplay", {
    id: 5,
    action: "toggleLabelDisplay",
    displayedName: "buttons.ToggleLabelDisplayedName",
    //icon: "$toggleLabelDisplay",
    toolGroup: "DisplayTools",
    toolTipMessage: "buttons.ToggleLabelToolTipMessage",
    toolUseMessage: "buttons.ToggleLabelToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("move", {
    id: 15,
    action: "move",
    displayedName: "buttons.MoveDisplayedName",
    //icon: "$move",
    toolGroup: "DisplayTools",
    toolTipMessage: "buttons.MoveObjectToolTipMessage",
    toolUseMessage: "buttons.MoveObjectToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("rotate", {
    id: 20,
    action: "rotate",
    displayedName: "buttons.RotateDisplayedName",
    //icon: "$rotate",
    toolGroup: "DisplayTools",
    toolTipMessage: "buttons.RotateSphereToolTipMessage",
    toolUseMessage: "buttons.RotateSphereToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("zoomIn", {
    id: 25,
    action: "zoomIn",
    displayedName: "buttons.PanZoomInDisplayedName",
    //icon: "$zoomIn",
    toolGroup: "DisplayTools",
    toolTipMessage: "buttons.PanZoomInToolTipMessage",
    toolUseMessage: "buttons.PanZoomInToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("zoomOut", {
    id: 30,
    action: "zoomOut",
    displayedName: "buttons.PanZoomOutDisplayedName",
    //icon: "$zoomOut",
    toolGroup: "DisplayTools",
    toolTipMessage: "buttons.PanZoomOutToolTipMessage",
    toolUseMessage: "buttons.PanZoomOutToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("zoomFit", {
    id: 35,
    action: "zoomFit",
    displayedName: "buttons.ZoomFitDisplayedName",
    //icon: "$zoomFit",
    toolGroup: "DisplayTools",
    toolTipMessage: "buttons.ZoomFitToolTipMessage",
    toolUseMessage: "buttons.ZoomFitToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("point", {
    id: 0,
    action: "point",
    displayedName: "buttons.CreatePointDisplayedName",
    //icon: "$point",
    toolGroup: "BasicTools",
    toolTipMessage: "buttons.CreatePointToolTipMessage",
    toolUseMessage: "buttons.CreatePointToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("line", {
    id: 5,
    action: "line",
    displayedName: "buttons.CreateLineDisplayedName",
    //icon: "$line",
    toolGroup: "BasicTools",
    toolTipMessage: "buttons.CreateLineToolTipMessage",
    toolUseMessage: "buttons.CreateLineToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("segment", {
    id: 10,
    action: "segment",
    displayedName: "buttons.CreateLineSegmentDisplayedName",
    //icon: "$segment",
    toolGroup: "BasicTools",
    toolTipMessage: "buttons.CreateLineSegmentToolTipMessage",
    toolUseMessage: "buttons.CreateLineSegmentToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("circle", {
    id: 20,
    action: "circle",
    displayedName: "buttons.CreateCircleDisplayedName",
    //icon: "$circle",
    toolGroup: "BasicTools",
    toolTipMessage: "buttons.CreateCircleToolTipMessage",
    toolUseMessage: "buttons.CreateCircleToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("antipodalPoint", {
    id: 0,
    action: "antipodalPoint",
    displayedName: "buttons.CreateAntipodalPointDisplayedName",
    //icon: "$antipodalPoint",
    toolGroup: "ConstructionTools",
    toolTipMessage: "buttons.CreateAntipodalPointToolTipMessage",
    toolUseMessage: "buttons.CreateAntipodalPointToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("polar", {
    id: 5,
    action: "polar",
    displayedName: "buttons.CreatePolarDisplayedName",
    //icon: "$polar",
    toolGroup: "ConstructionTools",
    toolTipMessage: "buttons.CreatePolarToolTipMessage",
    toolUseMessage: "buttons.CreatePolarToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("midpoint", {
    id: 10,
    action: "midpoint",
    displayedName: "buttons.CreateMidpointDisplayedName",
    //icon: "$midpoint",
    toolGroup: "ConstructionTools",
    toolTipMessage: "buttons.CreateMidpointToolTipMessage",
    toolUseMessage: "buttons.CreateMidpointToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("angleBisector", {
    id: 15,
    action: "angleBisector",
    displayedName: "buttons.CreateAngleBisectorDisplayedName",
    //icon: "$angleBisector",
    toolGroup: "ConstructionTools",
    toolTipMessage: "buttons.CreateAngleBisectorToolTipMessage",
    toolUseMessage: "buttons.CreateAngleBisectorToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("tangent", {
    id: 20,
    action: "tangent",
    displayedName: "buttons.CreateTangentDisplayedName",
    //icon: "$tangent",
    toolGroup: "ConstructionTools",
    toolTipMessage: "buttons.CreateTangentToolTipMessage",
    toolUseMessage: "buttons.CreateTangentToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("perpendicular", {
    id: 25,
    action: "perpendicular",
    displayedName: "buttons.CreatePerpendicularDisplayedName",
    //icon: "$perpendicular",
    toolGroup: "ConstructionTools",
    toolTipMessage: "buttons.CreatePerpendicularToolTipMessage",
    toolUseMessage: "buttons.CreatePerpendicularToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("intersect", {
    id: 30,
    action: "intersect",
    displayedName: "buttons.CreateIntersectionDisplayedName",
    //icon: "$intersect",
    toolGroup: "ConstructionTools",
    toolTipMessage: "buttons.CreateIntersectionToolTipMessage",
    toolUseMessage: "buttons.CreateIntersectionToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("pointOnObject", {
    id: 55,
    action: "pointOnObject",
    displayedName: "buttons.CreatePointOnOneDimDisplayedName",
    //icon: "$pointOnObject",
    toolGroup: "ConstructionTools",
    toolTipMessage: "buttons.CreatePointOnOneDimToolTipMessage",
    toolUseMessage: "buttons.CreatePointOnOneDimToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("angle", {
    id: 0,
    action: "angle",
    displayedName: "buttons.CreateAngleDisplayedName",
    //icon: "$angle",
    toolGroup: "MeasurementTools",
    toolTipMessage: "buttons.CreateAngleToolTipMessage",
    toolUseMessage: "buttons.CreateAngleToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("pointDistance", {
    id: 5,
    action: "pointDistance",
    displayedName: "buttons.CreatePointDistanceDisplayedName",
    //icon: "$pointDistance",
    toolGroup: "MeasurementTools",
    toolTipMessage: "buttons.CreatePointDistanceToolTipMessage",
    toolUseMessage: "buttons.CreatePointDistanceToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("segmentLength", {
    id: 10,
    action: "segmentLength",
    displayedName: "buttons.CreateSegmentLengthDisplayedName",
    //icon: "$segmentLength",
    toolGroup: "MeasurementTools",
    toolTipMessage: "buttons.CreateSegmentLengthToolTipMessage",
    toolUseMessage: "buttons.CreateSegmentLengthToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("coordinate", {
    id: 15,
    action: "coordinate",
    displayedName: "buttons.CreateCoordinateDisplayedName",
    //icon: "$coordinate",
    toolGroup: "MeasurementTools",
    toolTipMessage: "buttons.CreateCoordinateToolTipMessage",
    toolUseMessage: "buttons.CreateCoordinateToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("measureTriangle", {
    id: 20,
    action: "measureTriangle",
    displayedName: "buttons.MeasureTriangleDisplayedName",
    //icon: "$measureTriangle",
    toolGroup: "MeasurementTools",
    toolTipMessage: "buttons.MeasureTriangleToolTipMessage",
    toolUseMessage: "buttons.MeasureTriangleToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("measurePolygon", {
    id: 25,
    action: "measurePolygon",
    displayedName: "buttons.MeasurePolygonDisplayedName",
    //icon: "$measurePolygon",
    toolGroup: "MeasurementTools",
    toolTipMessage: "buttons.MeasurePolygonToolTipMessage",
    toolUseMessage: "buttons.MeasurePolygonToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("ellipse", {
    id: 0,
    action: "ellipse",
    displayedName: "buttons.CreateEllipseDisplayedName",
    //icon: "$ellipse",
    toolGroup: "ConicTools",
    toolTipMessage: "buttons.CreateEllipseToolTipMessage",
    toolUseMessage: "buttons.CreateEllipseToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("threePointCircle", {
    id: 0,
    action: "threePointCircle",
    displayedName: "buttons.CreateThreePointCircleDisplayedName",
    //icon: "$threePointCircle",
    toolGroup: "AdvancedTools",
    toolTipMessage: "buttons.CreateThreePointCircleToolTipMessage",
    toolUseMessage: "buttons.CreateThreePointCircleToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("nSectPoint", {
    id: 10,
    action: "nSectPoint",
    displayedName: "buttons.CreateNSectSegmentDisplayedName",
    //icon: "$nSectPoint",
    toolGroup: "AdvancedTools",
    toolTipMessage: "buttons.CreateNSectSegmentToolTipMessage",
    toolUseMessage: "buttons.CreateNSectSegmentToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("nSectLine", {
    id: 15,
    action: "nSectLine",
    displayedName: "buttons.CreateNSectAngleDisplayedName",
    //icon: "$nSectLine",
    toolGroup: "AdvancedTools",
    toolTipMessage: "buttons.CreateNSectAngleToolTipMessage",
    toolUseMessage: "buttons.CreateNSectAngleToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("pointReflection", {
    id: 0,
    action: "pointReflection",
    displayedName: "buttons.CreatePointReflectionDisplayedName",
    //icon: "$pointReflection",
    toolGroup: "TransformationTools",
    toolTipMessage: "buttons.CreatePointReflectionToolTipMessage",
    toolUseMessage: "buttons.CreatePointReflectionToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("reflection", {
    id: 5,
    action: "reflection",
    displayedName: "buttons.CreateReflectionDisplayedName",
    //icon: "$reflection",
    toolGroup: "TransformationTools",
    toolTipMessage: "buttons.CreateReflectionToolTipMessage",
    toolUseMessage: "buttons.CreateReflectionToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("rotation", {
    id: 10,
    action: "rotation",
    displayedName: "buttons.CreateRotationDisplayedName",
    //icon: "$rotation",
    toolGroup: "TransformationTools",
    toolTipMessage: "buttons.CreateRotationToolTipMessage",
    toolUseMessage: "buttons.CreateRotationToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("translation", {
    id: 15,
    action: "translation",
    displayedName: "buttons.CreateTranslationDisplayedName",
    //icon: "$translation",
    toolGroup: "TransformationTools",
    toolTipMessage: "buttons.CreateTranslationToolTipMessage",
    toolUseMessage: "buttons.CreateTranslationToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("inversion", {
    id: 20,
    action: "inversion",
    displayedName: "buttons.CreateInversionDisplayedName",
    //icon: "$inversion",
    toolGroup: "TransformationTools",
    toolTipMessage: "buttons.CreateInversionToolTipMessage",
    toolUseMessage: "buttons.CreateInversionToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("applyTransformation", {
    id: 25,
    action: "applyTransformation",
    displayedName: "buttons.ApplyTransformationDisplayedName",
    //icon: "$applyTransformation",
    toolGroup: "TransformationTools",
    toolTipMessage: "buttons.ApplyTransformationToolTipMessage",
    toolUseMessage: "buttons.ApplyTransformationToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  })
  .set("measuredCircle", {
    id: 15,
    action: "measuredCircle",
    displayedName: "buttons.CreateMeasuredCircleDisplayedName",
    //icon: "$measuredCircle",
    toolGroup: "MeasuredObjectTools",
    toolTipMessage: "buttons.CreateMeasuredCircleToolTipMessage",
    toolUseMessage: "buttons.CreateMeasuredCircleToolUseMessage"
    //displayToolUseMessage: false,
    //disableIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
  });
