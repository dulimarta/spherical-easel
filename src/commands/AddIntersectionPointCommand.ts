import { Command, PersistableCommand } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SEOneDimensional } from "@/types";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import Point from "@/plottables/Point";
import { DisplayStyle } from "@/plottables/Nodule";

export class AddIntersectionPointCommand extends Command {
  private sePoint: SEPoint;
  private parent1: SEOneDimensional;
  private parent2: SEOneDimensional;
  private seLabel: SELabel;

  constructor(
    sePoint: SEPoint,
    parent1: SEOneDimensional,
    parent2: SEOneDimensional,
    seLabel: SELabel
  ) {
    super();
    this.sePoint = sePoint;
    this.parent1 = parent1;
    this.parent2 = parent2;
    this.seLabel = seLabel;
  }

  do(): void {
    //console.log("Add intersection point command do");
    this.parent1.registerChild(this.sePoint);
    this.parent2.registerChild(this.sePoint);
    this.sePoint.registerChild(this.seLabel);
    Command.store.commit.addPoint(this.sePoint);
    Command.store.commit.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.sePoint.id;
  }

  restoreState(): void {
    Command.store.commit.removeLabel(this.seLabel.id);
    Command.store.commit.removePoint(this.lastState);
    this.sePoint.unregisterChild(this.seLabel);
    this.parent1.unregisterChild(this.sePoint);
    this.parent2.unregisterChild(this.sePoint);
  }

  toJSON(_arg: any): string {
    return [
      "AddIntersectionPoint",
      /* arg-1 */ this.sePoint.name,
      /* arg-2 */ this.sePoint.locationVector.toFixed(7),
      /* arg-3 */ this.sePoint.showing,
      /* arg-4 */ this.parent1.name,
      /* arg-5 */ this.parent2.name,
      /* arg-6 */ this.seLabel.name
    ].join("/");
    // We assume that "/" is not used anywhere in the object name
  }

  static parse(cmd: string, objMap: Map<string, SENodule>): Command {
    // console.log("Parsing", cmd);
    const tokens = cmd.split("/");
    const parent1 = objMap.get(tokens[4]) as SEOneDimensional;
    const parent2 = objMap.get(tokens[5]) as SEOneDimensional;
    if (parent1 && parent2) {
      const location = new Vector3();
      location.from(tokens[2]);

      const { point, label } = this.makePointAndLabel(location);
      point.showing = tokens[3] === "true";
      label.showing = tokens[3] === "true";
      return new AddIntersectionPointCommand(point, parent1, parent2, label);
    } else
      throw new Error(
        `AddIntersectionPoint: parent ${tokens[4]} or ${tokens[5]} is not found`
      );
  }
}
