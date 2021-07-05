import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SEOneDimensional, UpdateMode } from "@/types";
import { SELabel } from "@/models/SELabel";
import SETTINGS from "@/global-settings";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import { SESegment } from "@/models/SESegment";
import { SELine } from "@/models/SELine";
import { SEPolarPoint } from "@/models/SEPolarPoint";
import Point from "@/plottables/Point";
import { DisplayStyle } from "@/plottables/Nodule";
import { SEPointOnOneDimensional } from "@/models/SEPointOnOneDimensional";
import Label from "@/plottables/Label";

export class AddPolarPointCommand extends Command {
  private sePolarPoint: SEPolarPoint;
  private index: number;
  private parent: SELine | SESegment;
  private seLabel: SELabel;
  constructor(
    sePolarPoint: SEPolarPoint,
    index: number,
    parent: SELine | SESegment,
    seLabel: SELabel
  ) {
    super();
    this.sePolarPoint = sePolarPoint;
    this.parent = parent;
    this.seLabel = seLabel;
    this.index = index;
  }

  do(): void {
    this.parent.registerChild(this.sePolarPoint);
    this.sePolarPoint.registerChild(this.seLabel);
    if (SETTINGS.point.showLabelsOfPolarPointInitially) {
      this.seLabel.showing = true;
    } else {
      this.seLabel.showing = false;
    }
    Command.store.addPoint(this.sePolarPoint);
    Command.store.addLabel(this.seLabel);
    this.sePolarPoint.update({
      mode: UpdateMode.DisplayOnly,
      stateArray: []
    });
  }

  saveState(): void {
    this.lastState = this.sePolarPoint.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removePoint(this.lastState);
    this.sePolarPoint.unregisterChild(this.seLabel);
    this.parent.unregisterChild(this.sePolarPoint);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddPolarPoint",
      /* arg-1 */ this.sePolarPoint.name,
      /* arg-2 */ this.sePolarPoint.locationVector.toFixed(7),
      /* arg-3 */ this.parent.name,
      /* arg-4 */ this.seLabel.name,
      /* arg-5 */ this.sePolarPoint.showing,
      /* arg-6 */ this.sePolarPoint.exists,
      /* arg-7*/ this.index
    ].join("/");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("/");
    const parentLineOrSegment = objMap.get(tokens[3]) as
      | SELine
      | SESegment
      | undefined;
    if (parentLineOrSegment) {
      const pointPosition = new Vector3();
      pointPosition.from(tokens[2]);
      // const { point, label } = Command.makePointAndLabel(pointPosition); // We can't use this because we must create a SEPolarPoint and not just an SEPoint

      const newPoint = new Point();
      newPoint.stylize(DisplayStyle.ApplyCurrentVariables);
      newPoint.adjustSize();
      const index = Number(tokens[7]);
      const point = new SEPolarPoint(newPoint, parentLineOrSegment, index);
      point.locationVector.copy(pointPosition);

      const newLabel = new Label();
      const label = new SELabel(newLabel, point);
      label.locationVector.copy(pointPosition);
      const offset = SETTINGS.point.initialLabelOffset;
      label.locationVector.add(new Vector3(2 * offset, offset, 0)).normalize();

      point.showing = tokens[5] === "true";
      point.exists = tokens[6] === "true";
      point.name = tokens[1];
      objMap.set(tokens[1], point);
      label.showing = tokens[5] === "true";
      label.exists = tokens[6] === "true";
      label.name = tokens[4];
      objMap.set(tokens[4], label);
      return new AddPolarPointCommand(point, index, parentLineOrSegment, label);
    } else {
      throw new Error(`AddPolarPoint: parent object ${tokens[3]} is undefined`);
    }
  }
}
