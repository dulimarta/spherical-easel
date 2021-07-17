import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { StyleOptions, StyleEditPanels } from "../types/Styles";

export class StyleNoduleCommand extends Command {
  private seNodules: SENodule[] = [];
  private panel: StyleEditPanels;
  private currentStyles: StyleOptions[] = [];
  private pastStyles: StyleOptions[] = [];
  private currentBackStyleContrast: number | undefined;
  private pastBackStyleContrast: number | undefined;

  constructor(
    seNodules: SENodule[],
    panel: StyleEditPanels,
    currentStyles: StyleOptions[],
    pastStyles: StyleOptions[],
    currentBackStyleContrast?: number,
    pastBackStyleContrast?: number
  ) {
    super();
    seNodules.forEach(obj => this.seNodules.push(obj));
    this.panel = panel;
    // Carefully clone so that we create new objects and no pointer from the inputs are carried to the variables of this command
    currentStyles.forEach(obj => {
      // const newObj = {} as StyleOptions;
      // newObj.panel = obj.panel;
      // newObj.strokeWidthPercent = obj.strokeWidthPercent;
      // newObj.strokeColor = obj.strokeColor;
      // newObj.fillColor = obj.fillColor;
      // newObj.dashArray = [];
      // if (obj.dashArray) {
      //   if (obj.dashArray.length > 0) {
      //     newObj.dashArray[0] = obj.dashArray[0];
      //     newObj.dashArray[1] = obj.dashArray[1];
      //   }
      // } else {
      //   newObj.dashArray = undefined;
      // }
      // newObj.dynamicBackStyle = obj.dynamicBackStyle;
      // newObj.pointRadiusPercent = obj.pointRadiusPercent;
      // newObj.angleMarkerRadiusPercent = obj.angleMarkerRadiusPercent;
      // newObj.angleMarkerTickMark = obj.angleMarkerTickMark;
      // newObj.angleMarkerDoubleArc = obj.angleMarkerDoubleArc;

      // newObj.labelTextStyle = obj.labelTextStyle;
      // newObj.labelTextFamily = obj.labelTextFamily;
      // newObj.labelTextDecoration = obj.labelTextDecoration;
      // newObj.labelTextRotation = obj.labelTextRotation;
      // newObj.labelTextScalePercent = obj.labelTextScalePercent;
      // newObj.labelDisplayText = obj.labelDisplayText;
      // newObj.labelDisplayCaption = obj.labelDisplayCaption;
      // newObj.labelDisplayMode = obj.labelDisplayMode;
      // newObj.labelFrontFillColor = obj.labelFrontFillColor;
      // newObj.labelBackFillColor = obj.labelBackFillColor;

      this.currentStyles.push({ ...obj });
    });
    pastStyles.forEach(obj => {
      // const newObj = {} as StyleOptions;
      // newObj.panel = obj.panel;
      // newObj.strokeWidthPercent = obj.strokeWidthPercent;
      // newObj.strokeColor = obj.strokeColor;
      // newObj.fillColor = obj.fillColor;
      // newObj.dashArray = [];
      // if (obj.dashArray) {
      //   if (obj.dashArray.length > 0) {
      //     newObj.dashArray[0] = obj.dashArray[0];
      //     newObj.dashArray[1] = obj.dashArray[1];
      //   }
      // } else {
      //   newObj.dashArray = undefined;
      // }
      // newObj.dynamicBackStyle = obj.dynamicBackStyle;
      // newObj.pointRadiusPercent = obj.pointRadiusPercent;
      // newObj.angleMarkerRadiusPercent = obj.angleMarkerRadiusPercent;
      // newObj.angleMarkerTickMark = obj.angleMarkerTickMark;
      // newObj.angleMarkerDoubleArc = obj.angleMarkerDoubleArc;

      // newObj.labelTextStyle = obj.labelTextStyle;
      // newObj.labelTextFamily = obj.labelTextFamily;
      // newObj.labelTextDecoration = obj.labelTextDecoration;
      // newObj.labelTextRotation = obj.labelTextRotation;
      // newObj.labelTextScalePercent = obj.labelTextScalePercent;
      // newObj.labelDisplayText = obj.labelDisplayText;
      // newObj.labelDisplayCaption = obj.labelDisplayCaption;
      // newObj.labelDisplayMode = obj.labelDisplayMode;
      // newObj.labelFrontFillColor = obj.labelFrontFillColor;
      // newObj.labelBackFillColor = obj.labelBackFillColor;

      // newObj.objectVisibility = obj.objectVisibility;
      this.pastStyles.push({ ...obj });
    });
    this.currentBackStyleContrast = currentBackStyleContrast;
    this.pastBackStyleContrast = pastBackStyleContrast;
  }

  do(): void {
    for (let i = 0; i < this.seNodules.length; i++) {
      Command.store.changeStyle({
        selected: [this.seNodules[i]],
        panel: this.panel,
        payload: {
          ...this.currentStyles[i]
        }
      });
    }
  }

  saveState(): void {
    this.lastState = 0;
  }

  restoreState(): void {
    for (let i = 0; i < this.seNodules.length; i++) {
      Command.store.changeStyle({
        selected: [this.seNodules[i]],
        panel: this.panel,
        payload: {
          ...this.pastStyles[i]
        }
      });
    }
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
