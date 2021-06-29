import { Command } from "./Command";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SEOneDimensional, UpdateMode } from "@/types";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import Point from "@/plottables/Point";
import Label from "@/plottables/Label";
import SETTINGS from "@/global-settings";
import NonFreePoint from "@/plottables/NonFreePoint";
export class AddIntersectionPointCommand extends Command {
  private sePoint: SEIntersectionPoint;
  private parent1: SEOneDimensional;
  private parent2: SEOneDimensional;
  private seLabel: SELabel;

  constructor(
    sePoint: SEIntersectionPoint,
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
    this.parent1.registerChild(this.sePoint);
    this.parent2.registerChild(this.sePoint);
    this.sePoint.registerChild(this.seLabel);
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
    this.parent1.unregisterChild(this.sePoint);
    this.parent2.unregisterChild(this.sePoint);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddIntersectionPoint",
      /* arg-1 */ this.sePoint.name,
      /* arg-2 */ this.sePoint.locationVector.toFixed(7),
      /* arg-3 */ this.parent1.name,
      /* arg-4 */ this.parent2.name,
      /* arg-5 */ this.seLabel.name,
      /* arg-6 */ this.sePoint.isUserCreated,
      /* arg-7 */ this.sePoint.showing,
      /* arg-8 */ this.sePoint.exists
    ].join("/");
    // We assume that "/" is not used anywhere in the object name
  }

  static parse(cmd: string, objMap: Map<string, SENodule>): Command {
    const tokens = cmd.split("/");
    const parent1 = objMap.get(tokens[3]) as SEOneDimensional;
    const parent2 = objMap.get(tokens[4]) as SEOneDimensional;
    if (parent1 && parent2) {
      const location = new Vector3();
      location.from(tokens[2]);

      // Extra the intersection point order from the name
      const nameTokens = tokens[1]
        .replace(/^.+\(/, "")
        .replace(/\)$/, "")
        .split(",");
      const order = Number(nameTokens[2]);
      const point = new SEIntersectionPoint(
        new NonFreePoint(),
        parent1,
        parent2,
        order,
        tokens[6] === "true" // isUserCreated
      );
      point.showing = tokens[7] === "true";
      point.exists = tokens[8] === "true";
      point.name = tokens[1];
      objMap.set(tokens[1], point);

      const label = new SELabel(new Label(), point);
      label.locationVector.copy(location);

      const offset = SETTINGS.point.initialLabelOffset;
      label.locationVector.add(new Vector3(2 * offset, offset, 0)).normalize();

      label.showing = tokens[7] === "true";
      label.exists = tokens[8] === "true";
      label.name = tokens[5];
      objMap.set(tokens[7], label);
      return new AddIntersectionPointCommand(point, parent1, parent2, label);
    } else
      throw new Error(
        `AddIntersectionPoint: parent ${tokens[4]} or ${tokens[5]} is not found`
      );
  }
}
