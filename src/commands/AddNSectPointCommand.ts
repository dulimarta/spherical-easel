import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SEOneOrTwoDimensional, UpdateMode } from "@/types";
import { SELabel } from "@/models/SELabel";
import SETTINGS from "@/global-settings";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import { SESegment } from "@/models/SESegment";
import { SELine } from "@/models/SELine";
import { SEPolarPoint } from "@/models/SEPolarPoint";
import Point from "@/plottables/Point";
import { DisplayStyle } from "@/plottables/Nodule";
import { SEPointOnOneOrTwoDimensional } from "@/models/SEPointOnOneOrTwoDimensional";
import Label from "@/plottables/Label";
import { SENSectPoint } from "@/models/SENSectPoint";
import NonFreePoint from "@/plottables/NonFreePoint";

export class AddNSectPointCommand extends Command {
  private seNSectPoint: SENSectPoint;
  private parentSegment: SESegment;
  private seLabel: SELabel;
  constructor(
    seNSectPoint: SENSectPoint,
    parentSegment: SESegment,
    seLabel: SELabel
  ) {
    super();
    this.seNSectPoint = seNSectPoint;
    this.parentSegment = parentSegment;
    this.seLabel = seLabel;
  }

  do(): void {
    this.parentSegment.registerChild(this.seNSectPoint);
    this.seNSectPoint.registerChild(this.seLabel);
    if (SETTINGS.point.showLabelsOfNonFreePointsInitially) {
      this.seLabel.showing = true;
    } else {
      this.seLabel.showing = false;
    }
    Command.store.addPoint(this.seNSectPoint);
    Command.store.addLabel(this.seLabel);
    this.seNSectPoint.update({
      mode: UpdateMode.DisplayOnly,
      stateArray: []
    });
  }

  saveState(): void {
    this.lastState = this.seNSectPoint.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removePoint(this.lastState);
    this.seNSectPoint.unregisterChild(this.seLabel);
    this.parentSegment.unregisterChild(this.seNSectPoint);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddNSectPoint",
      /* arg-1 */ this.seNSectPoint.name,
      /* arg-2 */ this.seNSectPoint.locationVector.toFixed(7),
      /* arg-3 */ this.parentSegment.name,
      /* arg-4 */ this.seLabel.name,
      /* arg-5 */ this.seNSectPoint.showing,
      /* arg-6 */ this.seNSectPoint.exists,
      /* arg-7*/ this.seNSectPoint.index,
      /* arg-8*/ this.seNSectPoint.N
    ].join("/");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("/");
    const parentSegment = objMap.get(tokens[3]) as SESegment | undefined;
    if (parentSegment) {
      const pointPosition = new Vector3();
      pointPosition.from(tokens[2]);
      // const { point, label } = Command.makePointAndLabel(pointPosition); // We can't use this because we must create a SEPolarPoint and not just an SEPoint

      const newPoint = new NonFreePoint();
      newPoint.stylize(DisplayStyle.ApplyCurrentVariables);
      newPoint.adjustSize();
      const index = Number(tokens[7]);
      const N = Number(tokens[8]);
      const point = new SENSectPoint(newPoint, parentSegment, index, N);
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
      return new AddNSectPointCommand(point, parentSegment, label);
    } else {
      throw new Error(
        `AddPolarPoint: parentSegment object ${tokens[3]} is undefined`
      );
    }
  }
}
