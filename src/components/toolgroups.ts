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