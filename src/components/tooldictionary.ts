import { ActionMode, ToolButtonType } from "@/types";
import { Command } from "@/commands/Command";
import EventBus from "@/eventHandlers/EventBus";
import MouseHandler from "@/eventHandlers/MouseHandler";

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
    clickFunc: () => {
      EventBus.fire("initiate-clear-construction", {});
    }
  });

TOOL_DICTIONARY.set("select", {
  id: 0,
  action: "select",
  displayedName: "buttons.SelectDisplayedName",
  toolGroup: "EditTools",
  toolTipMessage: "buttons.SelectToolTipMessage",
  toolUseMessage: "buttons.SelectToolUseMessage"
}).set("delete", {
  id: 5,
  action: "delete",
  displayedName: "buttons.DeleteDisplayedName",
  toolGroup: "EditTools",
  toolTipMessage: "buttons.DeleteToolTipMessage",
  toolUseMessage: "buttons.DeleteToolUseMessage"
})
  .set("hide", {
    id: 0,
    action: "hide",
    displayedName: "buttons.HideDisplayedName",
    toolGroup: "DisplayTools",
    toolTipMessage: "buttons.HideObjectToolTipMessage",
    toolUseMessage: "buttons.HideObjectToolUseMessage"
  })
  .set("toggleLabelDisplay", {
    id: 5,
    action: "toggleLabelDisplay",
    displayedName: "buttons.ToggleLabelDisplayedName",
    toolGroup: "DisplayTools",
    toolTipMessage: "buttons.ToggleLabelToolTipMessage",
    toolUseMessage: "buttons.ToggleLabelToolUseMessage"
  })
  .set("move", {
    id: 15,
    action: "move",
    displayedName: "buttons.MoveDisplayedName",
    toolGroup: "DisplayTools",
    toolTipMessage: "buttons.MoveObjectToolTipMessage",
    toolUseMessage: "buttons.MoveObjectToolUseMessage"
  })
  .set("rotate", {
    id: 20,
    action: "rotate",
    displayedName: "buttons.RotateDisplayedName",
    toolGroup: "DisplayTools",
    toolTipMessage: "buttons.RotateSphereToolTipMessage",
    toolUseMessage: "buttons.RotateSphereToolUseMessage"
  })
  .set("zoomIn", {
    id: 25,
    action: "zoomIn",
    displayedName: "buttons.PanZoomInDisplayedName",
    toolGroup: "DisplayTools",
    toolTipMessage: "buttons.PanZoomInToolTipMessage",
    toolUseMessage: "buttons.PanZoomInToolUseMessage",
    clickFunc: () => {
      // The second arg is true when the first arg is a ratio
      MouseHandler.store.scaleZoomMagnificationFactorBy(0.9)
      EventBus.fire('zoom-updated', {})
    }
  })
  .set("zoomOut", {
    id: 30,
    action: "zoomOut",
    displayedName: "buttons.PanZoomOutDisplayedName",
    toolGroup: "DisplayTools",
    toolTipMessage: "buttons.PanZoomOutToolTipMessage",
    toolUseMessage: "buttons.PanZoomOutToolUseMessage",
    clickFunc: () => {
      // The second arg is true when the first arg is a ratio
      MouseHandler.store.scaleZoomMagnificationFactorBy(1.1)
      EventBus.fire('zoom-updated', {})
    }
  })
  .set("zoomFit", {
    id: 35,
    action: "zoomFit",
    displayedName: "buttons.ZoomFitDisplayedName",
    toolGroup: "DisplayTools",
    toolTipMessage: "buttons.ZoomFitToolTipMessage",
    toolUseMessage: "buttons.ZoomFitToolUseMessage",
    clickFunc: () => {
      MouseHandler.store.fitZoomMagnificationFactor()
      EventBus.fire('zoom-updated', {})
    }
  })
  .set("point", {
    id: 0,
    action: "point",
    displayedName: "buttons.CreatePointDisplayedName",
    toolGroup: "BasicTools",
    toolTipMessage: "buttons.CreatePointToolTipMessage",
    toolUseMessage: "buttons.CreatePointToolUseMessage"
  })
  .set("line", {
    id: 5,
    action: "line",
    displayedName: "buttons.CreateLineDisplayedName",
    toolGroup: "BasicTools",
    toolTipMessage: "buttons.CreateLineToolTipMessage",
    toolUseMessage: "buttons.CreateLineToolUseMessage"
  })
  .set("segment", {
    id: 10,
    action: "segment",
    displayedName: "buttons.CreateLineSegmentDisplayedName",
    toolGroup: "BasicTools",
    toolTipMessage: "buttons.CreateLineSegmentToolTipMessage",
    toolUseMessage: "buttons.CreateLineSegmentToolUseMessage"
  })
  .set("circle", {
    id: 20,
    action: "circle",
    displayedName: "buttons.CreateCircleDisplayedName",
    toolGroup: "BasicTools",
    toolTipMessage: "buttons.CreateCircleToolTipMessage",
    toolUseMessage: "buttons.CreateCircleToolUseMessage"
  })
  .set("antipodalPoint", {
    id: 0,
    action: "antipodalPoint",
    displayedName: "buttons.CreateAntipodalPointDisplayedName",
    toolGroup: "ConstructionTools",
    toolTipMessage: "buttons.CreateAntipodalPointToolTipMessage",
    toolUseMessage: "buttons.CreateAntipodalPointToolUseMessage"
  })
  .set("polar", {
    id: 5,
    action: "polar",
    displayedName: "buttons.CreatePolarDisplayedName",
    toolGroup: "ConstructionTools",
    toolTipMessage: "buttons.CreatePolarToolTipMessage",
    toolUseMessage: "buttons.CreatePolarToolUseMessage"
  })
  .set("midpoint", {
    id: 10,
    action: "midpoint",
    displayedName: "buttons.CreateMidpointDisplayedName",
    toolGroup: "ConstructionTools",
    toolTipMessage: "buttons.CreateMidpointToolTipMessage",
    toolUseMessage: "buttons.CreateMidpointToolUseMessage"
  })
  .set("angleBisector", {
    id: 15,
    action: "angleBisector",
    displayedName: "buttons.CreateAngleBisectorDisplayedName",
    toolGroup: "ConstructionTools",
    toolTipMessage: "buttons.CreateAngleBisectorToolTipMessage",
    toolUseMessage: "buttons.CreateAngleBisectorToolUseMessage"
  })
  .set("tangent", {
    id: 20,
    action: "tangent",
    displayedName: "buttons.CreateTangentDisplayedName",
    toolGroup: "ConstructionTools",
    toolTipMessage: "buttons.CreateTangentToolTipMessage",
    toolUseMessage: "buttons.CreateTangentToolUseMessage"
  })
  .set("perpendicular", {
    id: 25,
    action: "perpendicular",
    displayedName: "buttons.CreatePerpendicularDisplayedName",
    toolGroup: "ConstructionTools",
    toolTipMessage: "buttons.CreatePerpendicularToolTipMessage",
    toolUseMessage: "buttons.CreatePerpendicularToolUseMessage"
  })
  .set("intersect", {
    id: 30,
    action: "intersect",
    displayedName: "buttons.CreateIntersectionDisplayedName",
    toolGroup: "ConstructionTools",
    toolTipMessage: "buttons.CreateIntersectionToolTipMessage",
    toolUseMessage: "buttons.CreateIntersectionToolUseMessage"
  })
  .set("pointOnObject", {
    id: 55,
    action: "pointOnObject",
    displayedName: "buttons.CreatePointOnOneDimDisplayedName",
    toolGroup: "ConstructionTools",
    toolTipMessage: "buttons.CreatePointOnOneDimToolTipMessage",
    toolUseMessage: "buttons.CreatePointOnOneDimToolUseMessage"
  })
  .set("angle", {
    id: 0,
    action: "angle",
    displayedName: "buttons.CreateAngleDisplayedName",
    toolGroup: "MeasurementTools",
    toolTipMessage: "buttons.CreateAngleToolTipMessage",
    toolUseMessage: "buttons.CreateAngleToolUseMessage"
  })
  .set("pointDistance", {
    id: 5,
    action: "pointDistance",
    displayedName: "buttons.CreatePointDistanceDisplayedName",
    toolGroup: "MeasurementTools",
    toolTipMessage: "buttons.CreatePointDistanceToolTipMessage",
    toolUseMessage: "buttons.CreatePointDistanceToolUseMessage"
  })
  .set("segmentLength", {
    id: 10,
    action: "segmentLength",
    displayedName: "buttons.CreateSegmentLengthDisplayedName",
    toolGroup: "MeasurementTools",
    toolTipMessage: "buttons.CreateSegmentLengthToolTipMessage",
    toolUseMessage: "buttons.CreateSegmentLengthToolUseMessage"
  })
  .set("coordinate", {
    id: 15,
    action: "coordinate",
    displayedName: "buttons.CreateCoordinateDisplayedName",
    toolGroup: "MeasurementTools",
    toolTipMessage: "buttons.CreateCoordinateToolTipMessage",
    toolUseMessage: "buttons.CreateCoordinateToolUseMessage"
  })
  .set("measureTriangle", {
    id: 20,
    action: "measureTriangle",
    displayedName: "buttons.MeasureTriangleDisplayedName",
    toolGroup: "MeasurementTools",
    toolTipMessage: "buttons.MeasureTriangleToolTipMessage",
    toolUseMessage: "buttons.MeasureTriangleToolUseMessage"
  })
  .set("measurePolygon", {
    id: 25,
    action: "measurePolygon",
    displayedName: "buttons.MeasurePolygonDisplayedName",
    toolGroup: "MeasurementTools",
    toolTipMessage: "buttons.MeasurePolygonToolTipMessage",
    toolUseMessage: "buttons.MeasurePolygonToolUseMessage"
  })
  .set("ellipse", {
    id: 0,
    action: "ellipse",
    displayedName: "buttons.CreateEllipseDisplayedName",
    toolGroup: "ConicTools",
    toolTipMessage: "buttons.CreateEllipseToolTipMessage",
    toolUseMessage: "buttons.CreateEllipseToolUseMessage"
  })
  .set("threePointCircle", {
    id: 0,
    action: "threePointCircle",
    displayedName: "buttons.CreateThreePointCircleDisplayedName",
    toolGroup: "AdvancedTools",
    toolTipMessage: "buttons.CreateThreePointCircleToolTipMessage",
    toolUseMessage: "buttons.CreateThreePointCircleToolUseMessage"
  })
  .set("nSectPoint", {
    id: 10,
    action: "nSectPoint",
    displayedName: "buttons.CreateNSectSegmentDisplayedName",
    toolGroup: "AdvancedTools",
    toolTipMessage: "buttons.CreateNSectSegmentToolTipMessage",
    toolUseMessage: "buttons.CreateNSectSegmentToolUseMessage"
  })
  .set("nSectLine", {
    id: 15,
    action: "nSectLine",
    displayedName: "buttons.CreateNSectAngleDisplayedName",
    toolGroup: "AdvancedTools",
    toolTipMessage: "buttons.CreateNSectAngleToolTipMessage",
    toolUseMessage: "buttons.CreateNSectAngleToolUseMessage"
  })
  .set("pointReflection", {
    id: 0,
    action: "pointReflection",
    displayedName: "buttons.CreatePointReflectionDisplayedName",
    toolGroup: "TransformationTools",
    toolTipMessage: "buttons.CreatePointReflectionToolTipMessage",
    toolUseMessage: "buttons.CreatePointReflectionToolUseMessage"
  })
  .set("reflection", {
    id: 5,
    action: "reflection",
    displayedName: "buttons.CreateReflectionDisplayedName",
    toolGroup: "TransformationTools",
    toolTipMessage: "buttons.CreateReflectionToolTipMessage",
    toolUseMessage: "buttons.CreateReflectionToolUseMessage"
  })
  .set("rotation", {
    id: 10,
    action: "rotation",
    displayedName: "buttons.CreateRotationDisplayedName",
    toolGroup: "TransformationTools",
    toolTipMessage: "buttons.CreateRotationToolTipMessage",
    toolUseMessage: "buttons.CreateRotationToolUseMessage"
  })
  .set("translation", {
    id: 15,
    action: "translation",
    displayedName: "buttons.CreateTranslationDisplayedName",
    toolGroup: "TransformationTools",
    toolTipMessage: "buttons.CreateTranslationToolTipMessage",
    toolUseMessage: "buttons.CreateTranslationToolUseMessage"
  })
  .set("inversion", {
    id: 20,
    action: "inversion",
    displayedName: "buttons.CreateInversionDisplayedName",
    toolGroup: "TransformationTools",
    toolTipMessage: "buttons.CreateInversionToolTipMessage",
    toolUseMessage: "buttons.CreateInversionToolUseMessage"
  })
  .set("applyTransformation", {
    id: 25,
    action: "applyTransformation",
    displayedName: "buttons.ApplyTransformationDisplayedName",
    toolGroup: "TransformationTools",
    toolTipMessage: "buttons.ApplyTransformationToolTipMessage",
    toolUseMessage: "buttons.ApplyTransformationToolUseMessage"
  })
  .set("measuredCircle", {
    id: 15,
    action: "measuredCircle",
    displayedName: "buttons.CreateMeasuredCircleDisplayedName",
    toolGroup: "MeasuredObjectTools",
    toolTipMessage: "buttons.CreateMeasuredCircleToolTipMessage",
    toolUseMessage: "buttons.CreateMeasuredCircleToolUseMessage"
  })
  .set("iconFactory", {
    id: 0,
    action: "iconFactory",
    displayedName: "buttons.CreateIconDisplayedName",
    toolGroup: "DeveloperOnlyTools",
    toolTipMessage: "buttons.CreateIconToolTipMessage",
    toolUseMessage: "buttons.CreateIconToolUseMessage"
  })

  // Use this entry a a starter for a new tool
  TOOL_DICTIONARY.set("dummy", {
    id: 0,
    icon: "mdi-alphabetical",
    action: "dummy",
    displayedName: "buttons.DummyDisplayName",
    toolGroup: "EditTools",
    toolUseMessage: "buttons.DummyToolUseMessage",
    toolTipMessage: "buttons.DummyToolTipMessage"

  });
