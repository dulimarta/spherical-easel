import { ToolButtonGroup } from "@/types";
import {toolDictionary} from "@/components/tooldictionary";

export const toolGroups: Array<ToolButtonGroup> = []
const editTools: ToolButtonGroup = {
  group: "EditTools",
  children:[]
};
const displayTools: ToolButtonGroup = {
  group: "DisplayTools",
  children:[]
};
const basicTools: ToolButtonGroup = {
  group: "BasicTools",
  children:[]
};
const constructionTools: ToolButtonGroup = {
  group: "ConstructionTools",
  children:[]
};
const measurementTools: ToolButtonGroup = {
  group: "MeasurementTools",
  children:[]
};
const conicTools: ToolButtonGroup = {
  group: "ConicTools",
  children:[]
};
const advancedTools: ToolButtonGroup = {
  group: "AdvancedTools",
  children:[]
};
const transformationTools: ToolButtonGroup = {
  group: "TransformationTools",
  children:[]
};
const measuredObjectTools: ToolButtonGroup = {
  group: "MeasuredObjectTools",
  children:[]
};
for (const [key, value] of toolDictionary.entries()) {
  if(value.toolGroup === "EditTools")
  {
    editTools.children.push(toolDictionary.get(value.actionModeValue)!);
  }
  if(value.toolGroup === "DisplayTools")
  {
    displayTools.children.push(toolDictionary.get(value.actionModeValue)!);
  }
  if(value.toolGroup === "BasicTools")
  {
    basicTools.children.push(toolDictionary.get(value.actionModeValue)!);
  }
  if(value.toolGroup === "ConstructionTools")
  {
    constructionTools.children.push(toolDictionary.get(value.actionModeValue)!);
  }
  if(value.toolGroup === "MeasurementTools")
  {
    measurementTools.children.push(toolDictionary.get(value.actionModeValue)!);
  }
  if(value.toolGroup === "ConicTools")
  {
    conicTools.children.push(toolDictionary.get(value.actionModeValue)!);
  }
  if(value.toolGroup === "AdvancedTools")
  {
    advancedTools.children.push(toolDictionary.get(value.actionModeValue)!);
  }
  if(value.toolGroup === "TransformationTools")
  {
    transformationTools.children.push(toolDictionary.get(value.actionModeValue)!);
  }
  if(value.toolGroup === "MeasuredObjectTools")
  {
    measuredObjectTools.children.push(toolDictionary.get(value.actionModeValue)!);
  }
}
toolGroups.push(editTools);
toolGroups.push(displayTools);
toolGroups.push(basicTools);
toolGroups.push(constructionTools);
toolGroups.push(measurementTools);
toolGroups.push(conicTools);
toolGroups.push(advancedTools);
toolGroups.push(transformationTools);
toolGroups.push(measuredObjectTools);

//   /* Note: the group names below must match the identifier of
//      toolgroups.XXXXXX defined in the I18N translation files */
//   {
//     group: "EditTools",
//     children: [
//         // toolDictionary.get("select")!,
//         // toolDictionary.get("delete")!

//     ]
//   },
//   {
//     group: "DisplayTools",
//     children: [
//         toolDictionary.get("hide")!,
//         toolDictionary.get("toggleLabelDisplay")!,
//         toolDictionary.get("move")!,
//         toolDictionary.get("rotate")!,
//         toolDictionary.get("zoomIn")!,
//         toolDictionary.get("zoomOut")!,
//         toolDictionary.get("zoomFit")!
//     ]
//   },
//   {
//     group: "BasicTools",
//     children: [
//         toolDictionary.get("point")!,
//         toolDictionary.get("line")!,
//         toolDictionary.get("segment")!,
//         toolDictionary.get("circle")!
//     ]
//   },
//   {
//     group: "ConstructionTools",
//     children: [
//         toolDictionary.get("antipodalPoint")!,
//         toolDictionary.get("polar")!,
//         toolDictionary.get("midpoint")!,
//         toolDictionary.get("angleBisector")!,
//         toolDictionary.get("tangent")!,
//         toolDictionary.get("perpendicular")!,
//         toolDictionary.get("intersect")!,
//         toolDictionary.get("pointOnObject")!
//     ]
//   },
//   {
//     group: "MeasurementTools",
//     children: [
//         toolDictionary.get("angle")!,
//         toolDictionary.get("pointDistance")!,
//         toolDictionary.get("segmentLength")!,
//         toolDictionary.get("coordinate")!,
//         toolDictionary.get("measureTriangle")!,
//         toolDictionary.get("measurePolygon")!
//     ]
//   },
//   {
//     group: "ConicTools",
//     children: [
//         toolDictionary.get("ellipse")!
//     ]
//   },
//   {
//     group: "AdvancedTools",
//     children: [
//         toolDictionary.get("threePointCircle")!,
//         toolDictionary.get("nSectPoint")!,
//         toolDictionary.get("nSectLine")!
//     ]
//   },
//   {
//     group: "TransformationTools",
//     children: [
//         toolDictionary.get("pointReflection")!,
//         toolDictionary.get("reflection")!,
//         toolDictionary.get("rotation")!,
//         toolDictionary.get("translation")!,
//         toolDictionary.get("inversion")!,
//         toolDictionary.get("applyTransformation")!
//     ]
//   },
//   {
//     group: "MeasuredObjectTools",
//     children: [
//         toolDictionary.get("measuredCircle")!
//     ]
//   }
// ]