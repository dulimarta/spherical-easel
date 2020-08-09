import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { Styles, StyleOptions } from "../types/Styles";

export class StyleNoduleCommand extends Command {
  private seNodules: SENodule[] = [];
  private side: boolean;
  private currentStyles: StyleOptions[] = [];
  private pastStyles: StyleOptions[] = [];
  private currentBackStyleContrast: number | undefined;
  private pastBackStyleContrast: number | undefined;

  constructor(
    seNodules: SENodule[],
    side: boolean,
    currentStyles: StyleOptions[],
    pastStyles: StyleOptions[],
    currentBackStyleContrast?: number,
    pastBackStyleContrast?: number
  ) {
    super();
    seNodules.forEach(obj => this.seNodules.push(obj));
    this.side = side;
    // Carefully copy so that we create new objects and no pointer from the inputs are carried to the variables of this command
    currentStyles.forEach(obj => {
      const newObj = {} as StyleOptions;
      newObj.front = obj.front;
      newObj.strokeWidthPercent = obj.strokeWidthPercent;
      newObj.strokeColor = obj.strokeColor;
      newObj.fillColor = obj.fillColor;
      newObj.dashArray = [];
      if (obj.dashArray) {
        if (obj.dashArray.length > 0) {
          newObj.dashArray[0] = obj.dashArray[0];
          newObj.dashArray[1] = obj.dashArray[1];
        }
      } else {
        newObj.dashArray = undefined;
      }
      newObj.opacity = obj.opacity;
      newObj.dynamicBackStyle = obj.dynamicBackStyle;
      newObj.pointRadiusPercent = obj.pointRadiusPercent;
      this.currentStyles.push(newObj);
    });
    pastStyles.forEach(obj => {
      const newObj = {} as StyleOptions;
      newObj.front = obj.front;
      newObj.strokeWidthPercent = obj.strokeWidthPercent;
      newObj.strokeColor = obj.strokeColor;
      newObj.fillColor = obj.fillColor;
      newObj.dashArray = [];
      if (obj.dashArray) {
        if (obj.dashArray.length > 0) {
          newObj.dashArray[0] = obj.dashArray[0];
          newObj.dashArray[1] = obj.dashArray[1];
        }
      } else {
        newObj.dashArray = undefined;
      }
      newObj.opacity = obj.opacity;
      newObj.dynamicBackStyle = obj.dynamicBackStyle;
      newObj.pointRadiusPercent = obj.pointRadiusPercent;
      this.pastStyles.push(newObj);
    });
    this.currentBackStyleContrast = currentBackStyleContrast;
    this.pastBackStyleContrast = pastBackStyleContrast;
  }

  do(): void {
    console.log("do in syle nodule command");
    for (let i = 0; i < this.seNodules.length; i++) {
      Command.store.commit.changeStyle({
        selected: [this.seNodules[i]],
        payload: {
          front: this.side,
          strokeWidthPercent: this.currentStyles[i].strokeWidthPercent,
          strokeColor: this.currentStyles[i].strokeColor,
          fillColor: this.currentStyles[i].fillColor,
          dashArray: this.currentStyles[i].dashArray,
          opacity: this.currentStyles[i].opacity,
          dynamicBackStyle: this.currentStyles[i].dynamicBackStyle,
          pointRadiusPercent: this.currentStyles[i].pointRadiusPercent,
          backStyleContrast: this.currentBackStyleContrast
        }
      });
    }
  }

  saveState(): void {
    this.lastState = 0;
  }

  restoreState(): void {
    for (let i = 0; i < this.seNodules.length; i++) {
      Command.store.commit.changeStyle({
        selected: [this.seNodules[i]],
        payload: {
          front: this.side,
          strokeWidthPercent: this.pastStyles[i].strokeWidthPercent,
          strokeColor: this.pastStyles[i].strokeColor,
          fillColor: this.pastStyles[i].fillColor,
          dashArray: this.pastStyles[i].dashArray,
          opacity: this.pastStyles[i].opacity,
          dynamicBackStyle: this.pastStyles[i].dynamicBackStyle,
          pointRadiusPercent: this.pastStyles[i].pointRadiusPercent,
          backStyleContrast: this.pastBackStyleContrast
        }
      });
    }
  }
}
