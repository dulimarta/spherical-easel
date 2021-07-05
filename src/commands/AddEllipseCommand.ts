import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import { Matrix4, Vector3 } from "three";
import { DisplayStyle } from "@/plottables/Nodule";
import Label from "@/plottables/Label";
import SETTINGS from "@/global-settings";
import { SEEllipse } from "@/models/SEEllipse";
import Ellipse from "@/plottables/Ellipse";

export class AddEllipseCommand extends Command {
  private seEllipse: SEEllipse;
  private focus1SEPoint: SEPoint;
  private focus2SEPoint: SEPoint;
  private ellipseSEPoint: SEPoint;
  private seLabel: SELabel;
  constructor(
    seEllipse: SEEllipse,
    focus1SEPoint: SEPoint,
    focus2SEPoint: SEPoint,
    ellipseSEPoint: SEPoint,
    seLabel: SELabel
  ) {
    super();
    this.seEllipse = seEllipse;
    this.focus1SEPoint = focus1SEPoint;
    this.focus2SEPoint = focus2SEPoint;
    this.ellipseSEPoint = ellipseSEPoint;
    this.seLabel = seLabel;
  }

  do(): void {
    this.focus1SEPoint.registerChild(this.seEllipse);
    this.focus2SEPoint.registerChild(this.seEllipse);
    this.ellipseSEPoint.registerChild(this.seEllipse);
    this.seEllipse.registerChild(this.seLabel);
    Command.store.addEllipse(this.seEllipse);
    Command.store.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.seEllipse.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removeEllipse(this.lastState);
    this.seEllipse.unregisterChild(this.seLabel);
    this.ellipseSEPoint.unregisterChild(this.seEllipse);
    this.focus2SEPoint.unregisterChild(this.seEllipse);
    this.focus1SEPoint.unregisterChild(this.seEllipse);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddEllipse",
      /* arg-1 */ this.seEllipse.name,
      /* arg-2 */ this.seEllipse.a,
      /* arg-3 */ this.seEllipse.b,
      /* arg-4 */ this.focus1SEPoint.name,
      /* arg-5 */ this.focus2SEPoint.name,
      /* arg-6 */ this.ellipseSEPoint.name,
      /* arg-7 */ this.seLabel.name,
      /* arg-8 */ this.seEllipse.showing,
      /* arg-9 */ this.seEllipse.exists
    ].join("/");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("/");
    const focus1Point = objMap.get(tokens[4]) as SEPoint | undefined;
    const focus2Point = objMap.get(tokens[5]) as SEPoint | undefined;
    const ellipsePoint = objMap.get(tokens[6]) as SEPoint | undefined;
    if (focus1Point && focus2Point && ellipsePoint) {
      const ellipse = new Ellipse();
      ellipse.focus1Vector = focus1Point.locationVector;
      ellipse.focus2Vector = focus1Point.locationVector;
      ellipse.a = Number(tokens[2]);
      ellipse.b = Number(tokens[3]);
      ellipse.updateDisplay();
      ellipse.stylize(DisplayStyle.ApplyCurrentVariables);
      ellipse.adjustSize();
      const seEllipse = new SEEllipse(
        ellipse,
        focus1Point,
        focus2Point,
        ellipsePoint
      );
      seEllipse.name = tokens[1];
      objMap.set(tokens[1], seEllipse);
      seEllipse.showing = tokens[8] === "true";
      seEllipse.exists = tokens[9] === "true";
      const seLabel = new SELabel(new Label(), seEllipse);
      const rotationMatrix = new Matrix4();
      rotationMatrix.makeRotationAxis(ellipsePoint.locationVector, Math.PI / 2);

      const labelPosition = new Vector3();
      labelPosition
        .copy(ellipsePoint.locationVector)
        .applyMatrix4(rotationMatrix)
        .add(new Vector3(0, SETTINGS.ellipse.initialLabelOffset, 0))
        .normalize();
      seLabel.locationVector = labelPosition;
      seLabel.showing = tokens[6] === "true";
      seLabel.exists = tokens[7] === "true";
      seLabel.name = tokens[5];
      objMap.set(tokens[5], seLabel);
      return new AddEllipseCommand(
        seEllipse,
        focus1Point,
        focus2Point,
        ellipsePoint,
        seLabel
      );
    } else {
      throw new Error(
        `AddEllipseCommand: focus 1 point ${tokens[4]} or focus 2 point ${tokens[5]}  or ellipse point ${tokens[6]} is undefined`
      );
    }
  }
}
