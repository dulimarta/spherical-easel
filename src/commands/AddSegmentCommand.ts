import { Command } from "./Command";
import { SESegment } from "@/models/SESegment";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { DisplayStyle } from "@/plottables/Nodule";
import Segment from "@/plottables/Segment";
import { Vector3 } from "three";
import Label from "@/plottables/Label";
import SETTINGS from "@/global-settings";
import { SENodule } from "@/models/SENodule";

export class AddSegmentCommand extends Command {
  private seSegment: SESegment;
  private startSEPoint: SEPoint;
  private endSEPoint: SEPoint;
  private seLabel: SELabel;
  constructor(
    seSegment: SESegment,
    startSEPoint: SEPoint,
    endSEPoint: SEPoint,
    seLabel: SELabel
  ) {
    super();
    this.seSegment = seSegment;
    this.startSEPoint = startSEPoint;
    this.endSEPoint = endSEPoint;
    this.seLabel = seLabel;
  }

  do(): void {
    this.startSEPoint.registerChild(this.seSegment);
    this.endSEPoint.registerChild(this.seSegment);
    this.seSegment.registerChild(this.seLabel);
    Command.store.addSegment(this.seSegment);
    Command.store.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.seSegment.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removeSegment(this.lastState);
    this.seSegment.unregisterChild(this.seLabel);
    this.startSEPoint.unregisterChild(this.seSegment);
    this.endSEPoint.unregisterChild(this.seSegment);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddSegment",
      /* arg-1 */ this.seSegment.name,
      /* arg-2 */ this.seSegment.normalVector.toFixed(7),
      /* arg-3 */ this.seSegment.arcLength,
      /* arg-4 */ this.startSEPoint.name,
      /* arg-5 */ this.endSEPoint.name,
      /* arg-6 */ this.seLabel.name,
      /* arg-7 */ this.seSegment.showing,
      /* arg-8 */ this.seSegment.exists
    ].join("/");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    // WARNING: the split() trick below assumes that "/" does not occur anywhere
    // in the JSON output
    const tokens = command.split("/");

    // check if the start point already existed from previous command execution
    const startSEPoint = objMap.get(tokens[4]) as SEPoint | undefined;
    const endSEPoint = objMap.get(tokens[5]) as SEPoint | undefined;

    // At runtime, both the start point and end point
    // should have been created by a previous AddPointCommand
    if (startSEPoint && endSEPoint) {
      const normalVector = new Vector3();
      normalVector.from(tokens[2]);
      const arcLength = Number(tokens[3]);
      const segment = new Segment();
      segment.startVector = startSEPoint.locationVector;
      segment.arcLength = arcLength;
      segment.normalVector = normalVector;
      segment.updateDisplay();
      segment.stylize(DisplayStyle.ApplyCurrentVariables);
      segment.adjustSize();
      const newSESegment = new SESegment(
        segment,
        startSEPoint,
        normalVector,
        arcLength,
        endSEPoint
      );
      newSESegment.name = tokens[1];
      newSESegment.showing = tokens[7] === "true";
      newSESegment.exists = tokens[8] === "true";
      objMap.set(tokens[1], newSESegment);

      // check if the label already existed from previous command execution
      const newSELabel = new SELabel(new Label(), newSESegment);
      const labelPosition = new Vector3();
      labelPosition
        .addVectors(startSEPoint.locationVector, endSEPoint.locationVector)
        .normalize()
        .add(new Vector3(0, SETTINGS.line.initialLabelOffset, 0))
        .normalize();
      if (arcLength > Math.PI) labelPosition.multiplyScalar(-1);
      newSELabel.locationVector = labelPosition;
      newSELabel.name = tokens[8];
      newSELabel.showing = tokens[7] === "true";
      newSELabel.exists = tokens[8] === "true";
      objMap.set(tokens[6], newSELabel);
      return new AddSegmentCommand(
        newSESegment,
        startSEPoint,
        endSEPoint,
        newSELabel
      );
    } else {
      throw new Error(
        `AddSegmentCommand: end points ${tokens[4]} or ${tokens[5]} is not defined`
      );
    }
  }
}
