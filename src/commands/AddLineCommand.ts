import { Command } from "./Command";
import { SELine } from "@/models/SELine";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import Line from "@/plottables/Line";
import { DisplayStyle } from "@/plottables/Nodule";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import Label from "@/plottables/Label";
import SETTINGS from "@/global-settings";
export class AddLineCommand extends Command {
  private seLine: SELine;
  private startSEPoint: SEPoint;
  private endSEPoint: SEPoint;
  private seLabel: SELabel;

  constructor(
    seLine: SELine,
    startSEPoint: SEPoint,
    endSEPoint: SEPoint,
    seLabel: SELabel
  ) {
    super();
    this.seLine = seLine;
    this.startSEPoint = startSEPoint;
    this.endSEPoint = endSEPoint;
    this.seLabel = seLabel;
  }

  do(): void {
    this.startSEPoint.registerChild(this.seLine);
    this.endSEPoint.registerChild(this.seLine);
    this.seLine.registerChild(this.seLabel);
    Command.store.commit.addLine(this.seLine);
    Command.store.commit.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.seLine.id;
  }

  restoreState(): void {
    Command.store.commit.removeLabel(this.seLabel.id);
    Command.store.commit.removeLine(this.lastState);
    this.seLabel.unregisterChild(this.seLabel);
    this.startSEPoint.unregisterChild(this.seLine);
    this.endSEPoint.unregisterChild(this.seLine);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddLine",
      /* arg-1 */ this.seLine.name,
      /* arg-2 */ this.seLine.normalVector.toFixed(7),
      /* arg-3 */ this.startSEPoint.name,
      /* arg-4 */ this.endSEPoint.name,
      /* arg-5 */ this.seLabel.name
    ].join("/");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("/");
    const startPoint = objMap.get(tokens[3]) as SEPoint | undefined;
    const endPoint = objMap.get(tokens[4]) as SEPoint | undefined;
    if (startPoint && endPoint) {
      const normalVector = new Vector3();
      normalVector.from(tokens[2]);
      const newLine = new Line();
      newLine.normalVector = normalVector;
      newLine.stylize(DisplayStyle.ApplyCurrentVariables);
      newLine.adjustSize();
      const seLine = new SELine(newLine, startPoint, normalVector, endPoint);

      // The line highlighted by default?
      seLine.glowing = false;
      objMap.set(tokens[1], seLine);

      const seLabel = new SELabel(new Label(), seLine);
      const labelPosition = new Vector3();
      labelPosition
        .addVectors(startPoint.locationVector, endPoint.locationVector)
        .normalize()
        .add(new Vector3(0, SETTINGS.line.initialLabelOffset, 0))
        .normalize();
      seLabel.locationVector = labelPosition;
      objMap.set(tokens[5], seLabel);
      return new AddLineCommand(seLine, startPoint, endPoint, seLabel);
    } else {
      throw new Error(
        `AddLineCommand: endpoints ${tokens[3]} or ${tokens[4]} is not defined`
      );
    }
  }
}
