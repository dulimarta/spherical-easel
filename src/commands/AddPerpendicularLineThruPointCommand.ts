import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SEPerpendicularLineThruPoint } from "@/models/SEPerpendicularLineThruPoint";
import { SEOneDimensional, UpdateMode } from "@/types";
import Line from "@/plottables/Line";
import { DisplayStyle } from "@/plottables/Nodule";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import Label from "@/plottables/Label";
import SETTINGS from "@/global-settings";
import NonFreePoint from "@/plottables/NonFreePoint";
export class AddPerpendicularLineThruPointCommand extends Command {
  private sePerpendicularLineThruPoint: SEPerpendicularLineThruPoint;
  private parentSEPoint: SEPoint;
  private parentOneDimensional: SEOneDimensional;
  private seLabel: SELabel;

  constructor(
    sePerpendicularLineThruPoint: SEPerpendicularLineThruPoint,
    parentSEPoint: SEPoint,
    parentOneDimensional: SEOneDimensional,
    seLabel: SELabel
  ) {
    super();
    this.sePerpendicularLineThruPoint = sePerpendicularLineThruPoint;
    this.parentSEPoint = parentSEPoint;
    this.parentOneDimensional = parentOneDimensional;
    this.seLabel = seLabel;
  }

  do(): void {
    this.parentSEPoint.registerChild(this.sePerpendicularLineThruPoint);
    this.parentOneDimensional.registerChild(this.sePerpendicularLineThruPoint);
    this.sePerpendicularLineThruPoint.registerChild(this.seLabel);
    Command.store.commit.addLine(this.sePerpendicularLineThruPoint);
    Command.store.commit.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.sePerpendicularLineThruPoint.id;
  }

  restoreState(): void {
    Command.store.commit.removeLabel(this.seLabel.id);
    Command.store.commit.removeLine(this.lastState);
    this.sePerpendicularLineThruPoint.unregisterChild(this.seLabel);
    this.parentOneDimensional.unregisterChild(
      this.sePerpendicularLineThruPoint
    );
    this.parentSEPoint.unregisterChild(this.sePerpendicularLineThruPoint);
  }

  toOpcode(): null | string | Array<string> {
    const targetPoint = this.sePerpendicularLineThruPoint;
    return [
      "AddPerpendicularLineThruPoint",
      /* arg-1 */ targetPoint.name,
      /* arg-2 */ targetPoint.normalVector.toFixed(7),
      /* arg-3 */ targetPoint.startSEPoint.name,
      /* arg-4 */ targetPoint.endSEPoint.name,
      /* arg-5 */ targetPoint.endSEPoint.locationVector.toFixed(7),
      /* arg-6 */ this.parentOneDimensional.name,
      /* arg-7 */ this.seLabel.name
    ].join("/");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("/");
    const startPoint = objMap.get(tokens[3]) as SEPoint | undefined;
    const perpToLine = objMap.get(tokens[6]) as SEOneDimensional | undefined;
    if (startPoint && perpToLine) {
      const line = new Line();
      line.stylize(DisplayStyle.ApplyCurrentVariables);
      line.adjustSize();
      const normal = new Vector3();
      normal.from(tokens[2]);
      5;
      const endPoint = new SEPoint(new NonFreePoint());
      endPoint.showing = false;
      endPoint.exists = true;
      const endLocation = new Vector3();
      endLocation.from(tokens[5]);
      endPoint.locationVector = endLocation;
      const seLine = new SEPerpendicularLineThruPoint(
        line,
        perpToLine,
        startPoint,
        normal,
        endPoint
      );
      seLine.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
      objMap.set(tokens[1], seLine);

      const seLabel = new SELabel(new Label(), perpToLine);
      const labelPosition = new Vector3()
        .copy(endPoint.locationVector)
        .add(
          new Vector3(
            2 * SETTINGS.point.initialLabelOffset,
            SETTINGS.point.initialLabelOffset,
            0
          )
        )
        .normalize();
      seLabel.locationVector = labelPosition;
      objMap.set(tokens[7], seLabel);
      return new AddPerpendicularLineThruPointCommand(
        seLine,
        startPoint,
        perpToLine,
        seLabel
      );
    } else {
      throw new Error(
        `AddPerpendicularLineThruPoint: parent start point ${tokens[3]} or parent line ${tokens[6]} is undefined`
      );
    }
  }
}
