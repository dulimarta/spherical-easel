import { Command, PersistableCommand } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { Vector3 } from "three";
import { UpdateMode } from "@/types";
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
    if (this.sePoint.showing)
      return [
        "AddPoint",
        /* arg-1 */ this.sePoint.name,
        /* arg-2 */ this.sePoint.locationVector.toFixed(7),
        /* arg-3 */ this.sePoint.showing,
        /* arg-4 */ this.seLabel.name
      ].join("/");
    else return "None";
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    // console.log("Parsing", command);
    const tokens = command.split("/");
    const location = new Vector3();
    location.from(tokens[2]); // convert to Number
    const { point, label } = Command.makePointAndLabel(location);
    objMap.set(tokens[1], point);
    objMap.set(tokens[4], label);
    point.showing = tokens[3] === "true";
    label.showing = tokens[3] === "true";
    return new AddPointCommand(point, label);
  }
}
//#endregion addPointCommand
