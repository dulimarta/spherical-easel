import { Command } from "./Command";
import { UpdateMode } from "@/types";
import { SELabel } from "@/models/SELabel";
import SETTINGS from "@/global-settings";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import Point from "@/plottables/Point";
import { DisplayStyle } from "@/plottables/Nodule";
import Label from "@/plottables/Label";
import { SEParametricTracePoint } from "@/models/SEParametricTracePoint";
import { SEParametric } from "@/models/SEParametric";

export class AddParametricTracePointCommand extends Command {
  private seTracePoint: SEParametricTracePoint;
  private parametricParent: SEParametric;
  private seTraceLabel: SELabel;
  constructor(
    parametricParent: SEParametric,
    tracePoint: SEParametricTracePoint,
    traceLabel: SELabel
  ) {
    super();
    this.parametricParent = parametricParent;
    this.seTracePoint = tracePoint;
    this.seTraceLabel = traceLabel;
  }

  do(): void {
    this.parametricParent.registerChild(this.seTracePoint);
    this.seTracePoint.registerChild(this.seTraceLabel);
    if (SETTINGS.point.showLabelsOfParametricEndPointsInitially) {
      this.seTraceLabel.showing = true;
    } else {
      this.seTraceLabel.showing = false;
    }
    Command.store.addPoint(this.seTracePoint);
    Command.store.addLabel(this.seTraceLabel);
    this.seTracePoint.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
  }

  saveState(): void {
    // No code needed here
  }

  restoreState(): void {
    Command.store.removeLabel(this.seTraceLabel.id);
    Command.store.removePoint(this.seTracePoint.id);
    this.seTracePoint.unregisterChild(this.seTraceLabel);
    this.parametricParent.unregisterChild(this.seTracePoint);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddParametricTracePoint",
      /* arg-1 */ this.parametricParent.name,
      /* arg-2 */ this.seTracePoint.name,
      /* arg-3 */ this.seTracePoint.locationVector.toFixed(7),
      /* arg-4 */ this.seTracePoint.showing,
      /* arg-5 */ this.seTracePoint.exists,
      /* arg-6 */ this.seTraceLabel.name,
      /* arg-7 */ this.seTraceLabel.showing,
      /* arg-8 */ this.seTraceLabel.exists
    ].join("/");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("/");
    const parametricParent = objMap.get(tokens[1]) as SEParametric | undefined;
    if (parametricParent) {
      const tracePosition = new Vector3();
      tracePosition.from(tokens[3]);
      const tracePoint = new Point();
      tracePoint.stylize(DisplayStyle.ApplyCurrentVariables);
      tracePoint.adjustSize();
      const seTracePoint = new SEParametricTracePoint(
        tracePoint,
        parametricParent
      );
      seTracePoint.locationVector.copy(tracePosition);
      seTracePoint.showing = tokens[4] === "true";
      seTracePoint.exists = tokens[5] === "true";
      seTracePoint.name = tokens[2];
      objMap.set(tokens[2], seTracePoint);

      const offset = SETTINGS.point.initialLabelOffset;

      const traceLabel = new SELabel(new Label(), seTracePoint);
      traceLabel.locationVector.copy(tracePosition);
      traceLabel.locationVector
        .add(new Vector3(2 * offset, offset, 0))
        .normalize();
      traceLabel.showing = tokens[7] === "true";
      traceLabel.exists = tokens[8] === "true";
      traceLabel.name = tokens[6];
      objMap.set(tokens[6], traceLabel);

      return new AddParametricTracePointCommand(
        parametricParent,
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
