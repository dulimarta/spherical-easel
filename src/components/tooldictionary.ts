import {ActionMode, ToolButtonType} from "@/types";
import { Command } from "@/commands/Command"
import EventBus from "@/eventHandlers/EventBus";
import SETTINGS from "@/global-settings";

// Note: when adding a new tool, will also need to add a new case in SphereFrame.vue switchActionMode()
export const toolDictionary: Map<ActionMode, ToolButtonType> = new Map()
toolDictionary.set("select", {
    id: 0,
    actionModeValue: "select",
    displayedName: "SelectDisplayedName",
    icon: "$vuetify.icons.value.select",
    toolGroup: "EditTools",
    toolTipMessage: "SelectToolTipMessage",
    toolUseMessage: "SelectToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("delete", {
    id: 5,
    actionModeValue: "delete",
    displayedName: "DeleteDisplayedName",
    icon: "$vuetify.icons.value.delete",
    toolGroup: "EditTools",
    toolTipMessage: "DeleteToolTipMessage",
    toolUseMessage: "DeleteToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("hide", {
    id: 0,
    actionModeValue: "hide",
    displayedName: "HideDisplayedName",
    icon: "$vuetify.icons.value.hide",
    toolGroup: "DisplayTools",
    toolTipMessage: "HideObjectToolTipMessage",
    toolUseMessage: "HideObjectToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("toggleLabelDisplay", {
    id: 5,
    actionModeValue: "toggleLabelDisplay",
    displayedName: "ToggleLabelDisplayedName",
    icon: "$vuetify.icons.value.toggleLabelDisplay",
    toolGroup: "DisplayTools",
    toolTipMessage: "ToggleLabelToolTipMessage",
    toolUseMessage: "ToggleLabelToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("move", {
    id: 15,
    actionModeValue: "move",
    displayedName: "MoveDisplayedName",
    icon: "$vuetify.icons.value.move",
    toolGroup: "DisplayTools",
    toolTipMessage: "MoveObjectToolTipMessage",
    toolUseMessage: "MoveObjectToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("rotate", {
    id: 20,
    actionModeValue: "rotate",
    displayedName: "RotateDisplayedName",
    icon: "$vuetify.icons.value.rotate",
    toolGroup: "DisplayTools",
    toolTipMessage: "RotateSphereToolTipMessage",
    toolUseMessage: "RotateSphereToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("zoomIn", {
    id: 25,
    actionModeValue: "zoomIn",
    displayedName: "PanZoomInDisplayedName",
    icon: "$vuetify.icons.value.zoomIn",
    toolGroup: "DisplayTools",
    toolTipMessage: "PanZoomInToolTipMessage",
    toolUseMessage: "PanZoomInToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("zoomOut", {
    id: 30,
    actionModeValue: "zoomOut",
    displayedName: "PanZoomOutDisplayedName",
    icon: "$vuetify.icons.value.zoomOut",
    toolGroup: "DisplayTools",
    toolTipMessage: "PanZoomOutToolTipMessage",
    toolUseMessage: "PanZoomOutToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("zoomFit", {
    id: 35,
    actionModeValue: "zoomFit",
    displayedName: "ZoomFitDisplayedName",
    icon: "$vuetify.icons.value.zoomFit",
    toolGroup: "DisplayTools",
    toolTipMessage: "ZoomFitToolTipMessage",
    toolUseMessage: "ZoomFitToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("point", {
    id: 0,
    actionModeValue: "point",
    displayedName: "CreatePointDisplayedName",
    icon: "$vuetify.icons.value.point",
    toolGroup: "BasicTools",
    toolTipMessage: "CreatePointToolTipMessage",
    toolUseMessage: "CreatePointToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("line", {
    id: 5,
    actionModeValue: "line",
    displayedName: "CreateLineDisplayedName",
    icon: "$vuetify.icons.value.line",
    toolGroup: "BasicTools",
    toolTipMessage: "CreateLineToolTipMessage",
    toolUseMessage: "CreateLineToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("segment", {
    id: 10,
    actionModeValue: "segment",
    displayedName: "CreateLineSegmentDisplayedName",
    icon: "$vuetify.icons.value.segment",
    toolGroup: "BasicTools",
    toolTipMessage: "CreateLineSegmentToolTipMessage",
    toolUseMessage: "CreateLineSegmentToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("circle", {
    id: 20,
    actionModeValue: "circle",
    displayedName: "CreateCircleDisplayedName",
    icon: "$vuetify.icons.value.circle",
    toolGroup: "BasicTools",
    toolTipMessage: "CreateCircleToolTipMessage",
    toolUseMessage: "CreateCircleToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("antipodalPoint", {
    id: 0,
    actionModeValue: "antipodalPoint",
    displayedName: "CreateAntipodalPointDisplayedName",
    icon: "$vuetify.icons.value.antipodalPoint",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreateAntipodalPointToolTipMessage",
    toolUseMessage: "CreateAntipodalPointToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("polar", {
    id: 5,
    actionModeValue: "polar",
    displayedName: "CreatePolarDisplayedName",
    icon: "$vuetify.icons.value.polar",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreatePolarToolTipMessage",
    toolUseMessage: "CreatePolarToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("midpoint", {
    id: 10,
    actionModeValue: "midpoint",
    displayedName: "CreateMidpointDisplayedName",
    icon: "$vuetify.icons.value.midpoint",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreateMidpointToolTipMessage",
    toolUseMessage: "CreateMidpointToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("angleBisector", {
    id: 15,
    actionModeValue: "angleBisector",
    displayedName: "CreateAngleBisectorDisplayedName",
    icon: "$vuetify.icons.value.angleBisector",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreateAngleBisectorToolTipMessage",
    toolUseMessage: "CreateAngleBisectorToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("tangent", {
    id: 20,
    actionModeValue: "tangent",
    displayedName: "CreateTangentDisplayedName",
    icon: "$vuetify.icons.value.tangent",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreateTangentToolTipMessage",
    toolUseMessage: "CreateTangentToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("perpendicular", {
    id: 25,
    actionModeValue: "perpendicular",
    displayedName: "CreatePerpendicularDisplayedName",
    icon: "$vuetify.icons.value.perpendicular",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreatePerpendicularToolTipMessage",
    toolUseMessage: "CreatePerpendicularToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("intersect", {
    id: 30,
    actionModeValue: "intersect",
    displayedName: "CreateIntersectionDisplayedName",
    icon: "$vuetify.icons.value.intersect",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreateIntersectionToolTipMessage",
    toolUseMessage: "CreateIntersectionToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("pointOnObject", {
    id: 55,
    actionModeValue: "pointOnObject",
    displayedName: "CreatePointOnOneDimDisplayedName",
    icon: "$vuetify.icons.value.pointOnObject",
    toolGroup: "ConstructionTools",
    toolTipMessage: "CreatePointOnOneDimToolTipMessage",
    toolUseMessage: "CreatePointOnOneDimToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("angle", {
    id: 0,
    actionModeValue: "angle",
    displayedName: "CreateAngleDisplayedName",
    icon: "$vuetify.icons.value.angle",
    toolGroup: "MeasurementTools",
    toolTipMessage: "CreateAngleToolTipMessage",
    toolUseMessage: "CreateAngleToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("pointDistance", {
    id: 5,
    actionModeValue: "pointDistance",
    displayedName: "CreatePointDistanceDisplayedName",
    icon: "$vuetify.icons.value.pointDistance",
    toolGroup: "MeasurementTools",
    toolTipMessage: "CreatePointDistanceToolTipMessage",
    toolUseMessage: "CreatePointDistanceToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("segmentLength", {
    id: 10,
    actionModeValue: "segmentLength",
    displayedName: "CreateSegmentLengthDisplayedName",
    icon: "$vuetify.icons.value.segmentLength",
    toolGroup: "MeasurementTools",
    toolTipMessage: "CreateSegmentLengthToolTipMessage",
    toolUseMessage: "CreateSegmentLengthToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("coordinate", {
    id: 15,
    actionModeValue: "coordinate",
    displayedName: "CreateCoordinateDisplayedName",
    icon: "$vuetify.icons.value.coordinate",
    toolGroup: "MeasurementTools",
    toolTipMessage: "CreateCoordinateToolTipMessage",
    toolUseMessage: "CreateCoordinateToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("measureTriangle", {
    id: 20,
    actionModeValue: "measureTriangle",
    displayedName: "MeasureTriangleDisplayedName",
    icon: "$vuetify.icons.value.measureTriangle",
    toolGroup: "MeasurementTools",
    toolTipMessage: "MeasureTriangleToolTipMessage",
    toolUseMessage: "MeasureTriangleToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("measurePolygon", {
    id: 25,
    actionModeValue: "measurePolygon",
    displayedName: "MeasurePolygonDisplayedName",
    icon: "$vuetify.icons.value.measurePolygon",
    toolGroup: "MeasurementTools",
    toolTipMessage: "MeasurePolygonToolTipMessage",
    toolUseMessage: "MeasurePolygonToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("ellipse", {
    id: 0,
    actionModeValue: "ellipse",
    displayedName: "CreateEllipseDisplayedName",
    icon: "$vuetify.icons.value.ellipse",
    toolGroup: "ConicTools",
    toolTipMessage: "CreateEllipseToolTipMessage",
    toolUseMessage: "CreateEllipseToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("threePointCircle", {
    id: 0,
    actionModeValue: "threePointCircle",
    displayedName: "CreateThreePointCircleDisplayedName",
    icon: "$vuetify.icons.value.threePointCircle",
    toolGroup: "AdvancedTools",
    toolTipMessage: "CreateThreePointCircleToolTipMessage",
    toolUseMessage: "CreateThreePointCircleToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("nSectPoint", {
    id: 10,
    actionModeValue: "nSectPoint",
    displayedName: "CreateNSectSegmentDisplayedName",
    icon: "$vuetify.icons.value.nSectPoint",
    toolGroup: "AdvancedTools",
    toolTipMessage: "CreateNSectSegmentToolTipMessage",
    toolUseMessage: "CreateNSectSegmentToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("nSectLine", {
    id: 15,
    actionModeValue: "nSectLine",
    displayedName: "CreateNSectAngleDisplayedName",
    icon: "$vuetify.icons.value.nSectLine",
    toolGroup: "AdvancedTools",
    toolTipMessage: "CreateNSectAngleToolTipMessage",
    toolUseMessage: "CreateNSectAngleToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("pointReflection", {
    id: 0,
    actionModeValue: "pointReflection",
    displayedName: "CreatePointReflectionDisplayedName",
    icon: "$vuetify.icons.value.pointReflection",
    toolGroup: "TransformationTools",
    toolTipMessage: "CreatePointReflectionToolTipMessage",
    toolUseMessage: "CreatePointReflectionToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("reflection", {
    id: 5,
    actionModeValue: "reflection",
    displayedName: "CreateReflectionDisplayedName",
    icon: "$vuetify.icons.value.reflection",
    toolGroup: "TransformationTools",
    toolTipMessage: "CreateReflectionToolTipMessage",
    toolUseMessage: "CreateReflectionToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("rotation", {
    id: 10,
    actionModeValue: "rotation",
    displayedName: "CreateRotationDisplayedName",
    icon: "$vuetify.icons.value.rotation",
    toolGroup: "TransformationTools",
    toolTipMessage: "CreateRotationToolTipMessage",
    toolUseMessage: "CreateRotationToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("translation", {
    id: 15,
    actionModeValue: "translation",
    displayedName: "CreateTranslationDisplayedName",
    icon: "$vuetify.icons.value.translation",
    toolGroup: "TransformationTools",
    toolTipMessage: "CreateTranslationToolTipMessage",
    toolUseMessage: "CreateTranslationToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("inversion", {
    id: 20,
    actionModeValue: "inversion",
    displayedName: "CreateInversionDisplayedName",
    icon: "$vuetify.icons.value.inversion",
    toolGroup: "TransformationTools",
    toolTipMessage: "CreateInversionToolTipMessage",
    toolUseMessage: "CreateInversionToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("applyTransformation", {
    id: 25,
    actionModeValue: "applyTransformation",
    displayedName: "ApplyTransformationDisplayedName",
    icon: "$vuetify.icons.value.applyTransformation",
    toolGroup: "TransformationTools",
    toolTipMessage: "ApplyTransformationToolTipMessage",
    toolUseMessage: "ApplyTransformationToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("measuredCircle", {
    id: 15,
    actionModeValue: "measuredCircle",
    displayedName: "CreateMeasuredCircleDisplayedName",
    icon: "$vuetify.icons.value.measuredCircle",
    toolGroup: "MeasuredObjectTools",
    toolTipMessage: "CreateMeasuredCircleToolTipMessage",
    toolUseMessage: "CreateMeasuredCircleToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
// Note: I've added "undoAction" and "redoAction" to index.ts under ActionMode
toolDictionary.set("undoAction", {
    id: 0,
    actionModeValue: "undoAction",
    displayedName: "UndoLastActionDisplayedName",
    icon: "$vuetify.icons.value.undo",
    toolTipMessage: "UndoLastActionToolTipMessage",
    toolUseMessage: "UndoLastActionToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank",
    clickFunc: () => {
        Command.undo();
    }
})
toolDictionary.set("redoAction", {
    id: 5,
    actionModeValue: "redoAction",
    displayedName: "RedoLastActionDisplayedName",
    icon: "$vuetify.icons.value.redo",
    toolTipMessage: "RedoLastActionToolTipMessage",
    toolUseMessage: "RedoLastActionToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank",
    clickFunc: () => {
        Command.redo();
    }
})
toolDictionary.set("resetAction", {
    id: 10,
    actionModeValue: "resetAction",
    displayedName: "ResetSphereActionDisplayedName",
    icon: "$vuetify.icons.value.clearConstruction",
    toolTipMessage: "ResetSphereActionToolTipMessage",
    toolUseMessage: "ResetSphereActionToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank",
    clickFunc: () => {
        EventBus.fire("display-clear-construction-dialog-box", {});
    }
})