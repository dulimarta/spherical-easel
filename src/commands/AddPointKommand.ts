import { Command } from "./Command";
import { CKPoint } from "@/models/CKPoint";
import { Vector3 } from "three";
const TEMP_LABEL_OFFSET = new Vector3();
export class AddPointByCoordinatesKommand extends Command {
  private ptObject: CKPoint;
  constructor(position: Vector3) {
    super();
    this.ptObject = new CKPoint(position);
  }

  restoreState(preventGraphicalUpdate?: boolean): void {
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

export class AddPointByObjectKommand extends Command {
  private ptObject: CKPoint;
  constructor(pt: CKPoint) {
    super();
    this.ptObject = pt;
    // Place the label radially away from the point
    // This is not a perfect trick, but it works for now
    // TEMP_LABEL_OFFSET.set(position.x, position.y, 0)
    //   .normalize()
    //   .multiplyScalar(0.05);
    // const labelObject = new Label(this.ptObject.name, "point");
    // labelObject.positionVector = position.add(TEMP_LABEL_OFFSET).normalize();
    // labelObject.updateStyle(StyleCategory.Label, {
    //   labelDisplayText: this.ptObject.name
    // });
    // labelObject.stylize(DisplayStyle.ApplyCurrentVariables);
    // this.ptObject.labelRef = labelObject;
    // console.log("Created point:", this.ptObject);
  }

  restoreState(preventGraphicalUpdate?: boolean): void {
    // console.debug("Restoring state of AddPointKommand:", this.ptObject.name);
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
