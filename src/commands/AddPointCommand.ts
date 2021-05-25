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
    // Thanks to Will for suggesting the following magic line
    // that makes the objects show up correctly on the canvas
    this.sePoint.update({
      mode: UpdateMode.DisplayOnly,
      stateArray: []
    });
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

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    // console.log("Parsing", command);
    const tokens = command.split(" ");
    // Check if the point already exists from previous command execution
    let vtx = objMap.get(tokens[1]) as SEPoint | undefined;
    if (!vtx) {
      // console.log("Create point at", tokens[2]);
      const location = new Vector3();
      location.from(tokens[2]); // convert to Number
      const newPoint = new Point();
      newPoint.stylize(DisplayStyle.ApplyCurrentVariables);
      newPoint.adjustSize();
      vtx = new SEPoint(newPoint);
      vtx.locationVector = location;
      objMap.set(tokens[1], vtx);
    }
    // Check if the label already exists from previous command execution
    let seLabel = objMap.get(tokens[3]) as SELabel | undefined;
    if (!seLabel) {
      const newLabel = new Label();
      seLabel = new SELabel(newLabel, vtx);
      seLabel.locationVector.copy(vtx.locationVector);
      seLabel.locationVector
        .add(
          new Vector3(
            2 * SETTINGS.point.initialLabelOffset,
            SETTINGS.point.initialLabelOffset,
            0
          )
        )
        .normalize();
      objMap.set(tokens[3], seLabel);
    }
    return new AddPointCommand(vtx, seLabel);
  }
}
//#endregion addPointCommand
