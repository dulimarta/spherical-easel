import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { Vector3 } from "three";
import { UpdateMode } from "@/types";
import { SENodule } from "@/models/SENodule";

//#region addPointCommand
export class AddPointCommand extends Command {
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

  toOpcode(): null | string | Array<string> {
    return [
      "AddPoint",
      /* arg-1 */ this.sePoint.name,
      /* arg-2 */ this.sePoint.locationVector.toFixed(7),
      /* arg-3 */ this.seLabel.name,
      /* arg-4 */ this.sePoint.showing,
      /* arg-5 */ this.sePoint.exists
    ].join("/");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("/");
    const location = new Vector3();
    location.from(tokens[2]); // convert to Number
    const { point, label } = Command.makePointAndLabel(location);
    point.name = tokens[1];
    point.showing = tokens[4] === "true";
    point.exists = tokens[5] === "true";
    objMap.set(tokens[1], point);
    label.name = tokens[3];
    label.showing = tokens[4] === "true";
    label.exists = tokens[5] === "true";
    objMap.set(tokens[4], label);
    return new AddPointCommand(point, label);
  }
}
//#endregion addPointCommand
