import { Command, PersistableCommand } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { Vector3 } from "three";
import Point from "@/plottables/Point";
import Label from "@/plottables/Label";
import SETTINGS from "@/global-settings";
import { UpdateMode } from "@/types";
import { DisplayStyle } from "@/plottables/Nodule";
import { SENodule } from "@/models/SENodule";

//#region addPointCommand
export class AddPointCommand extends PersistableCommand {
  private sePoint: SEPoint;
  private seLabel: SELabel;
  constructor(sePoint: SEPoint, seLabel: SELabel) {
    super();
    this.sePoint = sePoint;
    this.seLabel = seLabel;
  }

  do(): void {
    Command.store.commit.addLabel(this.seLabel);
    this.sePoint.registerChild(this.seLabel);
    Command.store.commit.addPoint(this.sePoint);
  }

  saveState(): void {
    this.lastState = this.sePoint.id;
  }

  restoreState(): void {
    Command.store.commit.removeLabel(this.seLabel.id);
    this.sePoint.unregisterChild(this.seLabel);
    Command.store.commit.removePoint(this.lastState);
  }

  // eslint-disable-next-line
  toJSON(arg: any): string {
    return [
      "AddPoint",
      this.sePoint.name,
      this.sePoint.locationVector.toFixed(7),
      this.seLabel.name
    ].join(" ");
  }

  static parse(command: string, objMap: Map<string, SENodule>): void {
    console.log("Parsing", command);
    const tokens = command.split(" ");
    console.log("Create point at", tokens[2]);
    const location = new Vector3();
    location.from(tokens[2]); // convert to Number
    const newPoint = new Point();
    newPoint.stylize(DisplayStyle.ApplyCurrentVariables);
    newPoint.adjustSize();
    const newLabel = new Label();
    const vtx = new SEPoint(newPoint);
    vtx.locationVector = location;
    const newSELabel = new SELabel(newLabel, vtx);
    newSELabel.locationVector.copy(vtx.locationVector);
    newSELabel.locationVector
      .add(
        new Vector3(
          2 * SETTINGS.point.initialLabelOffset,
          SETTINGS.point.initialLabelOffset,
          0
        )
      )
      .normalize();

    new AddPointCommand(vtx, newSELabel).execute();
    // Thanks to Will for suggesting the following magic line
    // that makes the objects show up correctly on the canvas
    vtx.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
  }
}
//#endregion addPointCommand
