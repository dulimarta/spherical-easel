import { ActionMode, ToolButtonGroup } from "@/types";
import { TOOL_DICTIONARY } from "@/components/tooldictionary";

/* Note: the group names below must match the identifier of
     toolgroups.XXXXXX defined in the I18N translation files */
type ToolGroup = {
  group: string;
  tools: Array<ActionMode>;
};
const toolGroupInternal: Array<ToolGroup> = [
  // Uncommenting the "dummy" entry below will automatically
  // set the app for a new tool button, its associated event handler,
  // and a Command class
  { group: "EditTools", tools: ["select", "delete" /*, "dummy" */] },
  {
    group: "DisplayTools",
    tools: [
      "hide",
      "toggleLabelDisplay",
      "move",
      "rotate",
      "zoomIn",
      "zoomOut",
      "zoomFit"
    ]
  },
  {
    group: "BasicTools",
    tools: ["point", "line", "segment", "circle"]
  },
  {
    group: "ConstructionTools",
    tools: [
      "antipodalPoint",
      "polar",
      "midpoint",
      "angleBisector",
      "tangent",
      "perpendicular",
      "intersect",
      "pointOnObject"
    ]
  },
  {
    group: "MeasurementTools",
    tools: [
      "angle",
      "pointDistance",
      "segmentLength",
      "coordinate",
      "measureTriangle",
      "measurePolygon"
    ]
  },
  {
    group: "ConicTools",
    tools: ["ellipse"]
  },
  {
    group: "AdvancedTools",
    tools: ["threePointCircle", "nSectPoint", "nSectLine"]
  },
  {
    group: "TransformationTools",
    tools: [
      "pointReflection",
      "reflection",
      "rotation",
      "translation",
      "inversion",
      "applyTransformation"
    ]
  },
  {
    group: "MeasuredObjectTools",
    tools: ["measuredCircle"]
  },
  {
    group: "DeveloperOnlyTools",
    tools: ["iconFactory"]
  }
];

export const toolGroups: Array<ToolButtonGroup> = toolGroupInternal.map(x => ({
  group: x.group,
  children: x.tools.map((t: ActionMode) => TOOL_DICTIONARY.get(t)!)
}));
