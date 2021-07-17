import { Command } from "./Command";
import { UpdateMode } from "@/types";
import { SELabel } from "@/models/SELabel";
import SETTINGS from "@/global-settings";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import Point from "@/plottables/Point";
import { DisplayStyle } from "@/plottables/Nodule";
import Label from "@/plottables/Label";
import { SEParametricEndPoint } from "@/models/SEParametricEndPoint";
import { SEParametric } from "@/models/SEParametric";

export class AddParametricEndPointsCommand extends Command {
  private seStartEndPoint: SEParametricEndPoint;
  private seEndEndPoint: SEParametricEndPoint;
  private parametricParent: SEParametric;
  private seStartLabel: SELabel;
  private seEndLabel: SELabel;
  constructor(
    parametricParent: SEParametric,
    startEndPoint: SEParametricEndPoint,
    startLabel: SELabel,
    endEndPoint: SEParametricEndPoint,
    endLabel: SELabel
  ) {
    super();
    this.seStartEndPoint = startEndPoint;
    this.seEndEndPoint = endEndPoint;
    this.parametricParent = parametricParent;
    this.seStartLabel = startLabel;
    this.seEndLabel = endLabel;
  }

  do(): void {
    this.parametricParent.registerChild(this.seStartEndPoint);
    this.parametricParent.registerChild(this.seEndEndPoint);
    this.seStartEndPoint.registerChild(this.seStartLabel);
    this.seEndEndPoint.registerChild(this.seEndLabel);
    if (SETTINGS.point.showLabelsOfParametricEndPointsInitially) {
      this.seStartLabel.showing = true;
      this.seEndLabel.showing = true;
    } else {
      this.seStartLabel.showing = false;
      this.seEndLabel.showing = false;
    }
    Command.store.addPoint(this.seStartEndPoint);
    Command.store.addPoint(this.seEndEndPoint);
    Command.store.addLabel(this.seStartLabel);
    Command.store.addLabel(this.seEndLabel);
    this.seStartEndPoint.update({
      mode: UpdateMode.DisplayOnly,
      stateArray: []
    });
    this.seEndEndPoint.update({
      mode: UpdateMode.DisplayOnly,
      stateArray: []
    });
  }

  saveState(): void {
    this.lastState = this.seStartEndPoint.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seEndLabel.id);
    Command.store.removeLabel(this.seStartLabel.id);
    Command.store.removePoint(this.seEndEndPoint.id);
    Command.store.removePoint(this.seStartEndPoint.id);
    this.seEndEndPoint.unregisterChild(this.seEndLabel);
    this.seStartEndPoint.unregisterChild(this.seStartLabel);
    this.parametricParent.unregisterChild(this.seEndEndPoint);
    this.parametricParent.unregisterChild(this.seStartEndPoint);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddParametricEndPoints",
      /* arg-1 */ this.parametricParent.name,
      /* arg-2 */ this.seStartEndPoint.name,
      /* arg-3 */ this.seStartEndPoint.locationVector.toFixed(7),
      /* arg-4 */ this.seStartEndPoint.showing,
      /* arg-5 */ this.seStartEndPoint.exists,
      /* arg-6 */ this.seEndEndPoint.name,
      /* arg-7 */ this.seEndEndPoint.locationVector.toFixed(7),
      /* arg-8 */ this.seEndEndPoint.showing,
      /* arg-9 */ this.seEndEndPoint.exists,
      /* arg-10 */ this.seStartLabel.name,
      /* arg-11 */ this.seStartLabel.showing,
      /* arg-12 */ this.seStartLabel.exists,
      /* arg-13 */ this.seEndLabel.name,
      /* arg-14 */ this.seEndLabel.showing,
      /* arg-15 */ this.seEndLabel.exists
    ].join("/");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("/");
    const parametricParent = objMap.get(tokens[1]) as SEParametric | undefined;
    if (parametricParent) {
      const startPosition = new Vector3();
      startPosition.from(tokens[3]);
      // const { point, label } = Command.makePointAndLabel(pointPosition); // We can't use this because we must create a SEParametricEndPoint and not just an SEPoint
      const startPoint = new Point();
      startPoint.stylize(DisplayStyle.ApplyCurrentVariables);
      startPoint.adjustSize();
      const seStartPoint = new SEParametricEndPoint(
        startPoint,
        parametricParent,
        "min"
      );
      seStartPoint.locationVector.copy(startPosition);
      seStartPoint.showing = tokens[4] === "true";
      seStartPoint.exists = tokens[5] === "true";
      seStartPoint.name = tokens[2];
      objMap.set(tokens[2], seStartPoint);

      const startLabel = new SELabel(new Label(), seStartPoint);
      startLabel.locationVector.copy(startPosition);
      const offset = SETTINGS.point.initialLabelOffset;
      startLabel.locationVector
        .add(new Vector3(2 * offset, offset, 0))
        .normalize();
      startLabel.showing = tokens[11] === "true";
      startLabel.exists = tokens[12] === "true";
      startLabel.name = tokens[10];
      objMap.set(tokens[10], startLabel);

      const endPosition = new Vector3();
      endPosition.from(tokens[7]);
      // const { point, label } = Command.makePointAndLabel(pointPosition); // We can't use this because we must create a SEParametricEndPoint and not just an SEPoint
      const endPoint = new Point();
      endPoint.stylize(DisplayStyle.ApplyCurrentVariables);
      endPoint.adjustSize();
      const seEndPoint = new SEParametricEndPoint(
        endPoint,
        parametricParent,
        "max"
      );
      seEndPoint.locationVector.copy(endPosition);
      seEndPoint.showing = tokens[8] === "true";
      seEndPoint.exists = tokens[9] === "true";
      seEndPoint.name = tokens[6];
      objMap.set(tokens[6], seEndPoint);

      const endLabel = new SELabel(new Label(), seEndPoint);
      endLabel.locationVector.copy(endPosition);
      endLabel.locationVector
        .add(new Vector3(2 * offset, offset, 0))
        .normalize();
      endLabel.showing = tokens[14] === "true";
      endLabel.exists = tokens[15] === "true";
      endLabel.name = tokens[13];
      objMap.set(tokens[13], endLabel);

      return new AddParametricEndPointsCommand(
        parametricParent,
        seStartPoint,
        startLabel,
        seEndPoint,
        endLabel
      );
    } else {
      throw new Error(
        `AddParametricEndPoints: parametric parent ${tokens[1]} is undefined`
      );
    }
  }
}
