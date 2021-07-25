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
import NonFreeLine from "@/plottables/NonFreeLine";
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
    Command.store.addLine(this.sePerpendicularLineThruPoint);
    Command.store.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.sePerpendicularLineThruPoint.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removeLine(this.lastState);
    this.sePerpendicularLineThruPoint.unregisterChild(this.seLabel);
    this.parentOneDimensional.unregisterChild(
      this.sePerpendicularLineThruPoint
    );
    this.parentSEPoint.unregisterChild(this.sePerpendicularLineThruPoint);
  }

  toOpcode(): null | string | Array<string> {
    const targetLine = this.sePerpendicularLineThruPoint;
    return [
      "AddPerpendicularLineThruPoint",
      /* arg-1 */ targetLine.name,
      /* arg-2 */ targetLine.normalVector.toFixed(7),
      /* arg-3 */ targetLine.startSEPoint.name,
      /* arg-4 */ targetLine.endSEPoint.name,
      /* arg-5 */ targetLine.endSEPoint.locationVector.toFixed(7),
      /* arg-6 */ this.parentOneDimensional.name,
      /* arg-7 */ this.seLabel.name,
      /* arg-8 */ targetLine.showing,
      /* arg-9 */ targetLine.exists,
      /* arg-10*/ targetLine.index
    ].join("/");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("/");
    const startPoint = objMap.get(tokens[3]) as SEPoint | undefined;
    const perpToLine = objMap.get(tokens[6]) as SEOneDimensional | undefined;
    if (startPoint && perpToLine) {
      const line = new NonFreeLine();
      line.stylize(DisplayStyle.ApplyCurrentVariables);
      line.adjustSize();
      const normal = new Vector3();
      normal.from(tokens[2]);

      const endPoint = new SEPoint(new NonFreePoint());
      endPoint.showing = false;
      endPoint.exists = true;
      const endLocation = new Vector3();
      endLocation.from(tokens[5]);
      endPoint.locationVector = endLocation;
      const index = Number(tokens[10]);
      const seLine = new SEPerpendicularLineThruPoint(
        line,
        perpToLine,
        startPoint,
        normal,
        endPoint,
        index
      );
      seLine.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
      seLine.name = tokens[1];
      seLine.showing = tokens[8] === "true";
      seLine.exists = tokens[9] === "true";
      objMap.set(tokens[1], seLine);

      const seLabel = new SELabel(new Label(), seLine);
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
      seLabel.name = tokens[7];
      seLabel.showing = tokens[8] === "true";
      seLabel.exists = tokens[9] === "true";
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
