import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import { UpdateMode } from "@/types";

export class AddAntipodalPointCommand extends Command {
  private sePoint: SEPoint;
  private parentSEPoint: SEPoint;
  private seLabel: SELabel;
  constructor(sePoint: SEPoint, parentSEPoint: SEPoint, seLabel: SELabel) {
    super();
    this.sePoint = sePoint;
    this.parentSEPoint = parentSEPoint;
    this.seLabel = seLabel;
  }

  do(): void {
    this.parentSEPoint.registerChild(this.sePoint);
    this.sePoint.registerChild(this.seLabel);
    Command.store.commit.addPoint(this.sePoint);
    Command.store.commit.addLabel(this.seLabel);
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
    Command.store.commit.removePoint(this.lastState);
    this.sePoint.unregisterChild(this.seLabel);
    this.parentSEPoint.unregisterChild(this.sePoint);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddAntipodalPoint",
      /* arg-1 */ this.sePoint.name,
      /* arg-2 */ this.sePoint.locationVector.toFixed(7),
      /* arg-3 */ this.sePoint.showing,
      /* arg-4 */ this.parentSEPoint.name,
      /* arg-5 */ this.seLabel.name
    ].join("/");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("/");
    const parentPoint = objMap.get(tokens[3]) as SEPoint | undefined;
    if (parentPoint) {
      const location = new Vector3();
      location.from(tokens[2]);
      const { point, label } = Command.makePointAndLabel(location);
      point.showing = tokens[3] === "true";
      point.name = tokens[1];
      label.showing = tokens[3] === "true";
      label.name = tokens[5];
      objMap.set(tokens[1], point);
      objMap.set(tokens[5], label);
      return new AddAntipodalPointCommand(point, parentPoint, label);
    } else {
      throw new Error(
        `AddAntipodalPoint: parent point ${tokens[4]} is undefined`
      );
    }
  }
}
