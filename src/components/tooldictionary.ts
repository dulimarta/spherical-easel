import {ActionMode, ToolButtonType} from "@/types";
import { Command } from "@/commands/Command"
import EventBus from "@/eventHandlers/EventBus";

// Note: when adding a new tool, will also need to add a new case in SphereFrame.vue switchActionMode()
export const toolDictionary: Map<ActionMode, ToolButtonType> = new Map()
toolDictionary.set("select", {
    id: 0,
    action: "select",
    displayedName: "SelectDisplayedName",
    // icon: "$select",
    toolGroup: "EditTools",
    toolTipMessage: "SelectToolTipMessage",
    toolUseMessage: "SelectToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("delete", {
    id: 5,
    action: "delete",
    displayedName: "DeleteDisplayedName",
    // icon: "$delete",
    toolGroup: "EditTools",
    toolTipMessage: "DeleteToolTipMessage",
    toolUseMessage: "DeleteToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("hide", {
    id: 0,
    action: "hide",
    displayedName: "HideDisplayedName",
    // icon: "$hide",
    toolGroup: "DisplayTools",
    toolTipMessage: "HideObjectToolTipMessage",
    toolUseMessage: "HideObjectToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("toggleLabelDisplay", {
    id: 5,
    action: "toggleLabelDisplay",
    displayedName: "ToggleLabelDisplayedName",
//icon: "$toggleLabelDisplay",
    toolGroup: "DisplayTools",
    toolTipMessage: "ToggleLabelToolTipMessage",
    toolUseMessage: "ToggleLabelToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("move", {
    id: 15,
    action: "move",
    displayedName: "MoveDisplayedName",
//icon: "$move",
    toolGroup: "DisplayTools",
    toolTipMessage: "MoveObjectToolTipMessage",
    toolUseMessage: "MoveObjectToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("rotate", {
    id: 20,
    action: "rotate",
    displayedName: "RotateDisplayedName",
//icon: "$rotate",
    toolGroup: "DisplayTools",
    toolTipMessage: "RotateSphereToolTipMessage",
    toolUseMessage: "RotateSphereToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("zoomIn", {
    id: 25,
    action: "zoomIn",
    displayedName: "PanZoomInDisplayedName",
//icon: "$zoomIn",
    toolGroup: "DisplayTools",
    toolTipMessage: "PanZoomInToolTipMessage",
    toolUseMessage: "PanZoomInToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("zoomOut", {
    id: 30,
    action: "zoomOut",
    displayedName: "PanZoomOutDisplayedName",
//icon: "$zoomOut",
    toolGroup: "DisplayTools",
    toolTipMessage: "PanZoomOutToolTipMessage",
    toolUseMessage: "PanZoomOutToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("zoomFit", {
    id: 35,
    action: "zoomFit",
    displayedName: "ZoomFitDisplayedName",
//icon: "$zoomFit",
    toolGroup: "DisplayTools",
    toolTipMessage: "ZoomFitToolTipMessage",
    toolUseMessage: "ZoomFitToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("point", {
    id: 0,
    action: "point",
    displayedName: "CreatePointDisplayedName",
//icon: "$point",
    toolGroup: "BasicTools",
    toolTipMessage: "CreatePointToolTipMessage",
    toolUseMessage: "CreatePointToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("line", {
    id: 5,
    action: "line",
    displayedName: "CreateLineDisplayedName",
//icon: "$line",
    toolGroup: "BasicTools",
    toolTipMessage: "CreateLineToolTipMessage",
    toolUseMessage: "CreateLineToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("segment", {
    id: 10,
    action: "segment",
    displayedName: "CreateLineSegmentDisplayedName",
//icon: "$segment",
    toolGroup: "BasicTools",
    toolTipMessage: "CreateLineSegmentToolTipMessage",
    toolUseMessage: "CreateLineSegmentToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("circle", {
    id: 20,
    action: "circle",
    displayedName: "CreateCircleDisplayedName",
//icon: "$circle",
    toolGroup: "BasicTools",
    toolTipMessage: "CreateCircleToolTipMessage",
    toolUseMessage: "CreateCircleToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("antipodalPoint", {
    id: 0,
    action: "antipodalPoint",
    displayedName: "CreateAntipodalPointDisplayedName",
//icon: "$antipodalPoint",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreateAntipodalPointToolTipMessage",
    toolUseMessage: "CreateAntipodalPointToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("polar", {
    id: 5,
    action: "polar",
    displayedName: "CreatePolarDisplayedName",
//icon: "$polar",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreatePolarToolTipMessage",
    toolUseMessage: "CreatePolarToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("midpoint", {
    id: 10,
    action: "midpoint",
    displayedName: "CreateMidpointDisplayedName",
//icon: "$midpoint",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreateMidpointToolTipMessage",
    toolUseMessage: "CreateMidpointToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("angleBisector", {
    id: 15,
    action: "angleBisector",
    displayedName: "CreateAngleBisectorDisplayedName",
//icon: "$angleBisector",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreateAngleBisectorToolTipMessage",
    toolUseMessage: "CreateAngleBisectorToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("tangent", {
    id: 20,
    action: "tangent",
    displayedName: "CreateTangentDisplayedName",
//icon: "$tangent",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreateTangentToolTipMessage",
    toolUseMessage: "CreateTangentToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("perpendicular", {
    id: 25,
    action: "perpendicular",
    displayedName: "CreatePerpendicularDisplayedName",
//icon: "$perpendicular",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreatePerpendicularToolTipMessage",
    toolUseMessage: "CreatePerpendicularToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("intersect", {
    id: 30,
    action: "intersect",
    displayedName: "CreateIntersectionDisplayedName",
//icon: "$intersect",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreateIntersectionToolTipMessage",
    toolUseMessage: "CreateIntersectionToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("pointOnObject", {
    id: 55,
    action: "pointOnObject",
    displayedName: "CreatePointOnOneDimDisplayedName",
//icon: "$pointOnObject",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreatePointOnOneDimToolTipMessage",
    toolUseMessage: "CreatePointOnOneDimToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("angle", {
    id: 0,
    action: "angle",
    displayedName: "CreateAngleDisplayedName",
//icon: "$angle",
    toolGroup: "MeasurementTools",
    toolTipMessage: "CreateAngleToolTipMessage",
    toolUseMessage: "CreateAngleToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("pointDistance", {
    id: 5,
    action: "pointDistance",
    displayedName: "CreatePointDistanceDisplayedName",
//icon: "$pointDistance",
    toolGroup: "MeasurementTools",
    toolTipMessage: "CreatePointDistanceToolTipMessage",
    toolUseMessage: "CreatePointDistanceToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("segmentLength", {
    id: 10,
    action: "segmentLength",
    displayedName: "CreateSegmentLengthDisplayedName",
//icon: "$segmentLength",
    toolGroup: "MeasurementTools",
    toolTipMessage: "CreateSegmentLengthToolTipMessage",
    toolUseMessage: "CreateSegmentLengthToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("coordinate", {
    id: 15,
    action: "coordinate",
    displayedName: "CreateCoordinateDisplayedName",
//icon: "$coordinate",
    toolGroup: "MeasurementTools",
    toolTipMessage: "CreateCoordinateToolTipMessage",
    toolUseMessage: "CreateCoordinateToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("measureTriangle", {
    id: 20,
    action: "measureTriangle",
    displayedName: "MeasureTriangleDisplayedName",
//icon: "$measureTriangle",
    toolGroup: "MeasurementTools",
    toolTipMessage: "MeasureTriangleToolTipMessage",
    toolUseMessage: "MeasureTriangleToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("measurePolygon", {
    id: 25,
    action: "measurePolygon",
    displayedName: "MeasurePolygonDisplayedName",
//icon: "$measurePolygon",
    toolGroup: "MeasurementTools",
    toolTipMessage: "MeasurePolygonToolTipMessage",
    toolUseMessage: "MeasurePolygonToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("ellipse", {
    id: 0,
    action: "ellipse",
    displayedName: "CreateEllipseDisplayedName",
//icon: "$ellipse",
    toolGroup: "ConicTools",
    toolTipMessage: "CreateEllipseToolTipMessage",
    toolUseMessage: "CreateEllipseToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("threePointCircle", {
    id: 0,
    action: "threePointCircle",
    displayedName: "CreateThreePointCircleDisplayedName",
//icon: "$threePointCircle",
    toolGroup: "AdvancedTools",
    toolTipMessage: "CreateThreePointCircleToolTipMessage",
    toolUseMessage: "CreateThreePointCircleToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("nSectPoint", {
    id: 10,
    action: "nSectPoint",
    displayedName: "CreateNSectSegmentDisplayedName",
//icon: "$nSectPoint",
    toolGroup: "AdvancedTools",
    toolTipMessage: "CreateNSectSegmentToolTipMessage",
    toolUseMessage: "CreateNSectSegmentToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("nSectLine", {
    id: 15,
    action: "nSectLine",
    displayedName: "CreateNSectAngleDisplayedName",
//icon: "$nSectLine",
    toolGroup: "AdvancedTools",
    toolTipMessage: "CreateNSectAngleToolTipMessage",
    toolUseMessage: "CreateNSectAngleToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("pointReflection", {
    id: 0,
    action: "pointReflection",
    displayedName: "CreatePointReflectionDisplayedName",
//icon: "$pointReflection",
    toolGroup: "TransformationTools",
    toolTipMessage: "CreatePointReflectionToolTipMessage",
    toolUseMessage: "CreatePointReflectionToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("reflection", {
    id: 5,
    action: "reflection",
    displayedName: "CreateReflectionDisplayedName",
//icon: "$reflection",
    toolGroup: "TransformationTools",
    toolTipMessage: "CreateReflectionToolTipMessage",
    toolUseMessage: "CreateReflectionToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("rotation", {
    id: 10,
    action: "rotation",
    displayedName: "CreateRotationDisplayedName",
//icon: "$rotation",
    toolGroup: "TransformationTools",
    toolTipMessage: "CreateRotationToolTipMessage",
    toolUseMessage: "CreateRotationToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("translation", {
    id: 15,
    action: "translation",
    displayedName: "CreateTranslationDisplayedName",
//icon: "$translation",
    toolGroup: "TransformationTools",
    toolTipMessage: "CreateTranslationToolTipMessage",
    toolUseMessage: "CreateTranslationToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("inversion", {
    id: 20,
    action: "inversion",
    displayedName: "CreateInversionDisplayedName",
//icon: "$inversion",
    toolGroup: "TransformationTools",
    toolTipMessage: "CreateInversionToolTipMessage",
    toolUseMessage: "CreateInversionToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("applyTransformation", {
    id: 25,
    action: "applyTransformation",
    displayedName: "ApplyTransformationDisplayedName",
//icon: "$applyTransformation",
    toolGroup: "TransformationTools",
    toolTipMessage: "ApplyTransformationToolTipMessage",
    toolUseMessage: "ApplyTransformationToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("measuredCircle", {
    id: 15,
    action: "measuredCircle",
    displayedName: "CreateMeasuredCircleDisplayedName",
//icon: "$measuredCircle",
    toolGroup: "MeasuredObjectTools",
    toolTipMessage: "CreateMeasuredCircleToolTipMessage",
    toolUseMessage: "CreateMeasuredCircleToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("undoAction", {
    id: 0,
    action: "undoAction",
    displayedName: "UndoLastActionDisplayedName",
//icon: "$undo",
    toolTipMessage: "UndoLastActionToolTipMessage",
    toolUseMessage: "UndoLastActionToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank",
    clickFunc: () => {  // These have a clickFunc because the functions used to be statically defined in Easel.vue
        Command.undo();
    }
})
toolDictionary.set("redoAction", {
    id: 5,
    action: "redoAction",
    displayedName: "RedoLastActionDisplayedName",
//icon: "$redo",
    toolTipMessage: "RedoLastActionToolTipMessage",
    toolUseMessage: "RedoLastActionToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank",
    clickFunc: () => {
        Command.redo();
    }
})
toolDictionary.set("resetAction", {
    id: 10,
    action: "resetAction",
    displayedName: "ResetSphereActionDisplayedName",
//icon: "$clearConstruction",
    toolTipMessage: "ResetSphereActionToolTipMessage",
    toolUseMessage: "ResetSphereActionToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$blank",
    clickFunc: () => {
        EventBus.fire("display-clear-construction-dialog-box", {});
    }
})