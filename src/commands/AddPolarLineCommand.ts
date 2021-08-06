import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SEOneOrTwoDimensional, UpdateMode } from "@/types";
import Line from "@/plottables/Line";
import { DisplayStyle } from "@/plottables/Nodule";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import Label from "@/plottables/Label";
import SETTINGS from "@/global-settings";
import NonFreePoint from "@/plottables/NonFreePoint";
import { SEPolarLine } from "@/models/SEPolarLine";
import NonFreeLine from "@/plottables/NonFreeLine";

export class AddPolarLineCommand extends Command {
  private sePolarLine: SEPolarLine;
  private parentSEPoint: SEPoint;
  private seLabel: SELabel;

  constructor(
    sePolarLine: SEPolarLine,
    parentSEPoint: SEPoint,
    seLabel: SELabel
  ) {
    super();
    this.sePolarLine = sePolarLine;
    this.parentSEPoint = parentSEPoint;
    this.seLabel = seLabel;
  }

  do(): void {
    this.parentSEPoint.registerChild(this.sePolarLine);
    this.sePolarLine.registerChild(this.seLabel);
    Command.store.addLine(this.sePolarLine);
    Command.store.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.sePolarLine.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removeLine(this.lastState);
    this.sePolarLine.unregisterChild(this.seLabel);
    this.parentSEPoint.unregisterChild(this.sePolarLine);
  }

  toOpcode(): null | string | Array<string> {
    const targetLine = this.sePolarLine;
    return [
      "AddPolarLine",
      /* arg-1 */ targetLine.name,
      /* arg-2 */ targetLine.startSEPoint.name,
      /* arg-3 */ targetLine.startSEPoint.locationVector.toFixed(7),
      /* arg-4 */ targetLine.endSEPoint.name,
      /* arg-5 */ targetLine.endSEPoint.locationVector.toFixed(7),
      /* arg-6 */ this.seLabel.name,
      /* arg-7 */ targetLine.showing,
      /* arg-8 */ targetLine.exists,
      /* arg-9 */ this.parentSEPoint.name
    ].join("/");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("/");
    const parentPoint = objMap.get(tokens[9]) as SEPoint | undefined;

    if (parentPoint) {
      const line = new NonFreeLine();
      line.stylize(DisplayStyle.ApplyCurrentVariables);
      line.adjustSize();

      const endPoint = new SEPoint(new NonFreePoint());
      endPoint.showing = false;
      endPoint.exists = true;
      const endLocation = new Vector3();
      endLocation.from(tokens[5]);
      endPoint.locationVector = endLocation;

      const startPoint = new SEPoint(new NonFreePoint());
      startPoint.showing = false;
      startPoint.exists = true;
      const startLocation = new Vector3();
      startLocation.from(tokens[3]);
      startPoint.locationVector = startLocation;

      const seLine = new SEPolarLine(line, startPoint, endPoint, parentPoint);
      seLine.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
      seLine.name = tokens[1];
      seLine.showing = tokens[7] === "true";
      seLine.exists = tokens[8] === "true";
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
      seLabel.name = tokens[6];
      seLabel.showing = tokens[7] === "true";
      seLabel.exists = tokens[8] === "true";
      objMap.set(tokens[6], seLabel);
      return new AddPolarLineCommand(seLine, parentPoint, seLabel);
    } else {
      throw new Error(`AddPolarLine: parent point ${tokens[9]} is undefined`);
    }
  }
}
