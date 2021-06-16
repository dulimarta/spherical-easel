import { Command } from "./Command";
import { SECircle } from "@/models/SECircle";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import Circle from "@/plottables/Circle";
import { Matrix4, Vector3 } from "three";
import { DisplayStyle } from "@/plottables/Nodule";
import Label from "@/plottables/Label";
import SETTINGS from "@/global-settings";

export class AddCircleCommand extends Command {
  private seCircle: SECircle;
  private centerSEPoint: SEPoint;
  private circleSEPoint: SEPoint;
  private seLabel: SELabel;
  constructor(
    seCircle: SECircle,
    centerSEPoint: SEPoint,
    circleSEPoint: SEPoint,
    seLabel: SELabel
  ) {
    super();
    this.seCircle = seCircle;
    this.centerSEPoint = centerSEPoint;
    this.circleSEPoint = circleSEPoint;
    this.seLabel = seLabel;
  }

  do(): void {
    this.centerSEPoint.registerChild(this.seCircle);
    this.circleSEPoint.registerChild(this.seCircle);
    this.seCircle.registerChild(this.seLabel);
    Command.store.commit.addCircle(this.seCircle);
    Command.store.commit.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.seCircle.id;
  }

  restoreState(): void {
    Command.store.commit.removeLabel(this.seLabel.id);
    Command.store.commit.removeCircle(this.lastState);
    this.seCircle.unregisterChild(this.seLabel);
    this.centerSEPoint.unregisterChild(this.seCircle);
    this.circleSEPoint.unregisterChild(this.seCircle);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddCircle",
      /* arg-1 */ this.seCircle.name,
      /* arg-2 */ this.seCircle.circleRadius,
      /* arg-3 */ this.centerSEPoint.name,
      /* arg-4 */ this.circleSEPoint.name,
      /* arg-5 */ this.seLabel.name,
      /* arg-6 */ this.seCircle.showing,
      /* arg-7 */ this.seCircle.exists
    ].join("/");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("/");
    const centerPoint = objMap.get(tokens[3]) as SEPoint | undefined;
    const circlePoint = objMap.get(tokens[4]) as SEPoint | undefined;
    if (centerPoint && circlePoint) {
      const circle = new Circle();
      circle.centerVector = centerPoint.locationVector;
      circle.circleRadius = Number(tokens[2]);
      circle.updateDisplay();
      circle.stylize(DisplayStyle.ApplyCurrentVariables);
      circle.adjustSize();
      const seCircle = new SECircle(circle, centerPoint, circlePoint);
      seCircle.name = tokens[1];
      objMap.set(tokens[1], seCircle);
      seCircle.showing = tokens[6] === "true";
      seCircle.exists = tokens[7] === "true";
      const seLabel = new SELabel(new Label(), seCircle);
      const rotationMatrix = new Matrix4();
      rotationMatrix.makeRotationAxis(centerPoint.locationVector, Math.PI / 2);

      const labelPosition = new Vector3();
      labelPosition
        .copy(circlePoint.locationVector)
        .applyMatrix4(rotationMatrix)
        .add(new Vector3(0, SETTINGS.circle.initialLabelOffset, 0))
        .normalize();
      seLabel.locationVector = labelPosition;
      seLabel.showing = tokens[6] === "true";
      seLabel.exists = tokens[7] === "true";
      seLabel.name = tokens[5];
      objMap.set(tokens[5], seLabel);
      return new AddCircleCommand(seCircle, centerPoint, circlePoint, seLabel);
    } else {
      throw new Error(
        `AddCircleCommand: center point ${tokens[3]} or circle point ${tokens[4]} is undefined`
      );
    }
  }
}
