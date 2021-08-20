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
import { SEParametricTracePoint } from "@/models/SEParametricTracePoint";
import { SEParametric } from "@/models/SEParametric";

export class AddParametricEndPointsCommand extends Command {
  private seStartEndPoint: SEParametricEndPoint;
  private seEndEndPoint: SEParametricEndPoint;
  private seTracePoint: SEParametricTracePoint;
  private parametricParent: SEParametric;
  private seStartLabel: SELabel;
  private seEndLabel: SELabel;
  private seTraceLabel: SELabel;
  constructor(
    parametricParent: SEParametric,
    startEndPoint: SEParametricEndPoint,
    startLabel: SELabel,
    endEndPoint: SEParametricEndPoint,
    endLabel: SELabel,
    tracePoint: SEParametricTracePoint,
    traceLabel: SELabel
  ) {
    super();
    this.seStartEndPoint = startEndPoint;
    this.seEndEndPoint = endEndPoint;
    this.parametricParent = parametricParent;
    this.seStartLabel = startLabel;
    this.seEndLabel = endLabel;
    this.seTracePoint = tracePoint;
    this.seTraceLabel = traceLabel;
  }

  do(): void {
    this.parametricParent.registerChild(this.seStartEndPoint);
    this.parametricParent.registerChild(this.seEndEndPoint);
    this.parametricParent.registerChild(this.seTracePoint);
    this.seStartEndPoint.registerChild(this.seStartLabel);
    this.seEndEndPoint.registerChild(this.seEndLabel);
    this.seTracePoint.registerChild(this.seTraceLabel);
    if (SETTINGS.point.showLabelsOfParametricEndPointsInitially) {
      this.seStartLabel.showing = true;
      this.seEndLabel.showing = true;
      this.seTraceLabel.showing = true;
    } else {
      this.seStartLabel.showing = false;
      this.seEndLabel.showing = false;
      this.seTraceLabel.showing = false;
    }
    Command.store.addPoint(this.seStartEndPoint);
    Command.store.addPoint(this.seEndEndPoint);
    Command.store.addPoint(this.seTracePoint);
    Command.store.addLabel(this.seStartLabel);
    Command.store.addLabel(this.seEndLabel);
    Command.store.addLabel(this.seTraceLabel);
    this.seStartEndPoint.update({
      mode: UpdateMode.DisplayOnly,
      stateArray: []
    });
    this.seEndEndPoint.update({
      mode: UpdateMode.DisplayOnly,
      stateArray: []
    });
    this.seTracePoint.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
  }

  saveState(): void {
    this.lastState = this.seStartEndPoint.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seEndLabel.id);
    Command.store.removeLabel(this.seStartLabel.id);
    Command.store.removeLabel(this.seTraceLabel.id);
    Command.store.removePoint(this.seEndEndPoint.id);
    Command.store.removePoint(this.seStartEndPoint.id);
    Command.store.removePoint(this.seTracePoint.id);
    this.seEndEndPoint.unregisterChild(this.seEndLabel);
    this.seStartEndPoint.unregisterChild(this.seStartLabel);
    this.seTracePoint.unregisterChild(this.seTraceLabel);
    this.parametricParent.unregisterChild(this.seEndEndPoint);
    this.parametricParent.unregisterChild(this.seStartEndPoint);
    this.parametricParent.unregisterChild(this.seTracePoint);
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
      /* arg-10 */ this.seTracePoint.name,
      /* arg-11 */ this.seTracePoint.locationVector.toFixed(7),
      /* arg-12 */ this.seTracePoint.showing,
      /* arg-13 */ this.seTracePoint.exists,
      /* arg-14 */ this.seStartLabel.name,
      /* arg-15 */ this.seStartLabel.showing,
      /* arg-16 */ this.seStartLabel.exists,
      /* arg-17 */ this.seEndLabel.name,
      /* arg-18 */ this.seEndLabel.showing,
      /* arg-19 */ this.seEndLabel.exists,
      /* arg-20 */ this.seTraceLabel.name,
      /* arg-21 */ this.seTraceLabel.showing,
      /* arg-22 */ this.seTraceLabel.exists
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
      startLabel.showing = tokens[15] === "true";
      startLabel.exists = tokens[16] === "true";
      startLabel.name = tokens[14];
      objMap.set(tokens[14], startLabel);

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
      endLabel.showing = tokens[18] === "true";
      endLabel.exists = tokens[19] === "true";
      endLabel.name = tokens[17];
      objMap.set(tokens[17], endLabel);

      const tracePosition = new Vector3();
      tracePosition.from(tokens[11]);
      const tracePoint = new Point();
      tracePoint.stylize(DisplayStyle.ApplyCurrentVariables);
      tracePoint.adjustSize();
      const seTracePoint = new SEParametricTracePoint(
        tracePoint,
        parametricParent
      );
      seTracePoint.locationVector.copy(tracePosition);
      seTracePoint.showing = tokens[12] === "true";
      seTracePoint.exists = tokens[13] === "true";
      seTracePoint.name = tokens[10];
      objMap.set(tokens[10], seTracePoint);

      const traceLabel = new SELabel(new Label(), seTracePoint);
      traceLabel.locationVector.copy(tracePosition);
      traceLabel.locationVector
        .add(new Vector3(2 * offset, offset, 0))
        .normalize();
      traceLabel.showing = tokens[21] === "true";
      traceLabel.exists = tokens[22] === "true";
      traceLabel.name = tokens[20];
      objMap.set(tokens[20], traceLabel);

      return new AddParametricEndPointsCommand(
        parametricParent,
        seStartPoint,
        startLabel,
        seEndPoint,
        endLabel,
        seTracePoint,
        traceLabel
      );
    } else {
      throw new Error(
        `AddParametricEndPoints: parametric parent ${tokens[1]} is undefined`
      );
    }
  }
}
