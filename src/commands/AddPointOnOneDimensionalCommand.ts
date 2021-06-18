import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SEOneDimensional, UpdateMode } from "@/types";
import { SELabel } from "@/models/SELabel";
import SETTINGS from "@/global-settings";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";

export class AddPointOnOneDimensionalCommand extends Command {
  private sePoint: SEPoint;
  private parent: SEOneDimensional;
  private seLabel: SELabel;
  constructor(sePoint: SEPoint, parent: SEOneDimensional, seLabel: SELabel) {
    super();
    this.sePoint = sePoint;
    this.parent = parent;
    this.seLabel = seLabel;
  }

  do(): void {
    this.parent.registerChild(this.sePoint);
    this.sePoint.registerChild(this.seLabel);
    if (SETTINGS.point.showLabelsOfPointOnObjectInitially) {
      this.seLabel.showing = true;
    } else {
      this.seLabel.showing = false;
    }
    Command.store.addPoint(this.sePoint);
    Command.store.addLabel(this.seLabel);
    this.sePoint.update({
      mode: UpdateMode.DisplayOnly,
      stateArray: []
    });
  }

  saveState(): void {
    this.lastState = this.sePoint.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removePoint(this.lastState);
    this.sePoint.unregisterChild(this.seLabel);
    this.parent.unregisterChild(this.sePoint);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddPointOnOneDimensional",
      /* arg-1 */ this.sePoint.name,
      /* arg-2 */ this.sePoint.locationVector.toFixed(7),
      /* arg-3 */ this.parent.name,
      /* arg-4 */ this.seLabel.name,
      /* arg-5 */ this.sePoint.showing,
      /* arg-6 */ this.sePoint.exists
    ].join("/");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("/");
    const parentLine = objMap.get(tokens[3]) as SEOneDimensional | undefined;
    if (parentLine) {
      const pointPosition = new Vector3();
      pointPosition.from(tokens[2]);
      const { point, label } = Command.makePointAndLabel(pointPosition);
      point.showing = tokens[5] === "true";
      point.exists = tokens[6] === "true";
      point.name = tokens[1];
      objMap.set(tokens[1], point);
      label.showing = tokens[5] === "true";
      label.exists = tokens[6] === "true";
      label.name = tokens[4];
      objMap.set(tokens[4], label);
      return new AddPointOnOneDimensionalCommand(point, parentLine, label);
    } else {
      throw new Error(
        `AddPointOnOneDimensional: parent object ${tokens[3]} is undefined`
      );
    }
  }
}
