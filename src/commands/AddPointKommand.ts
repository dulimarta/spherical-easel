import { SELabel } from "@/models-spherical/SELabel";
import { Command } from "./Command";
import { CKPoint } from "@/models/CKPoint";
import { Vector3 } from "three";
import Label from "@/plottables-spherical/Label";
import { LabelParentTypes } from "@/types";
import { DisplayStyle } from "@/plottables-spherical/Nodule";
import { StyleCategory } from "@/types/Styles";
export class AddPointKommand extends Command {
  private ptObject: CKPoint;
  // private ptLabel: SELabel;
  constructor(position: Vector3) {
    super();
    this.ptObject = new CKPoint(position);
    const labelObject = new Label(this.ptObject.name, "point");
    // labelObject.defaultName = this.ptObject.name;
    labelObject.positionVector = position;
    labelObject.updateStyle(StyleCategory.Label, {
      labelDisplayText: this.ptObject.name
    });
    labelObject.stylize(DisplayStyle.ApplyCurrentVariables);
    this.ptObject.labelRef = labelObject;
    console.log("Created point:", this.ptObject);
  }

  restoreState(preventGraphicalUpdate?: boolean): void {
    console.debug("Restoring state of AddPointKommand:", this.ptObject.name);
    this.store.removePoint(this.ptObject.id);
  }

  saveState(): void {}

  do(preventGraphicalUpdate?: boolean): void {
    this.store.addPoint(this.ptObject);
  }

  toOpcode(): null | string | Array<string> {
    throw new Error("Method not implemented.");
  }
}
