import { ToolButtonGroup } from "@/types";
import {toolDictionary} from "@/components/tooldictionary";

export const toolGroups: Array<ToolButtonGroup> = [
  /* Note: the group names below must match the identifier of
     toolgroups.XXXXXX defined in the I18N translation files */
  {
    group: "EditTools",
    children: [
        toolDictionary.get("select")!,
        toolDictionary.get("delete")!
    ]
  },
  {
    group: "DisplayTools",
    children: [
        toolDictionary.get("hide")!,
        toolDictionary.get("toggleLabelDisplay")!,
        toolDictionary.get("move")!,
        toolDictionary.get("rotate")!,
        toolDictionary.get("zoomIn")!,
        toolDictionary.get("zoomOut")!,
        toolDictionary.get("zoomFit")!
    ]
  },
  {
    group: "BasicTools",
    children: [
        toolDictionary.get("point")!,
        toolDictionary.get("line")!,
        toolDictionary.get("segment")!,
        toolDictionary.get("circle")!
    ]
  },
  {
    group: "ConstructionTools",
    children: [
        toolDictionary.get("antipodalPoint")!,
        toolDictionary.get("polar")!,
        toolDictionary.get("midpoint")!,
        toolDictionary.get("angleBisector")!,
        toolDictionary.get("tangent")!,
        toolDictionary.get("perpendicular")!,
        toolDictionary.get("intersect")!,
        toolDictionary.get("pointOnObject")!
    ]
  },
  {
    group: "MeasurementTools",
    children: [
        toolDictionary.get("angle")!,
        toolDictionary.get("pointDistance")!,
        toolDictionary.get("segmentLength")!,
        toolDictionary.get("coordinate")!,
        toolDictionary.get("measureTriangle")!,
        toolDictionary.get("measurePolygon")!
    ]
  },
  {
    group: "ConicTools",
    children: [
        toolDictionary.get("ellipse")!
    ]
  },
  {
    group: "AdvancedTools",
    children: [
        toolDictionary.get("threePointCircle")!,
        toolDictionary.get("nSectPoint")!,
        toolDictionary.get("nSectLine")!
    ]
  },
  {
    group: "TransformationTools",
    children: [
        toolDictionary.get("pointReflection")!,
        toolDictionary.get("reflection")!,
        toolDictionary.get("rotation")!,
        toolDictionary.get("translation")!,
        toolDictionary.get("inversion")!,
        toolDictionary.get("applyTransformation")!
    ]
  },
  {
    group: "MeasuredObjectTools",
    children: [
        toolDictionary.get("measuredCircle")!
    ]
  }
];
