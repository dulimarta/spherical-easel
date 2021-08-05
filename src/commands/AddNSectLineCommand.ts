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
import { SENSectLine } from "@/models/SENSectLine";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import NonFreeLine from "@/plottables/NonFreeLine";

export class AddNSectLineCommand extends Command {
  private seNSectLine: SENSectLine;
  private parentAngle: SEAngleMarker;
  private seLabel: SELabel;
  constructor(
    seNSectLine: SENSectLine,
    parentAngle: SEAngleMarker,
    seLabel: SELabel
  ) {
    super();
    this.seNSectLine = seNSectLine;
    this.parentAngle = parentAngle;
    this.seLabel = seLabel;
  }

  do(): void {
    this.parentAngle.registerChild(this.seNSectLine);
    this.seNSectLine.registerChild(this.seLabel);
    if (SETTINGS.line.showLabelsOfNonFreeLinesInitially) {
      this.seLabel.showing = true;
    } else {
      this.seLabel.showing = false;
    }
    Command.store.addLine(this.seNSectLine);
    Command.store.addLabel(this.seLabel);
    this.seNSectLine.update({
      mode: UpdateMode.DisplayOnly,
      stateArray: []
    });
  }

  saveState(): void {
    this.lastState = this.seNSectLine.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removePoint(this.lastState);
    this.seNSectLine.unregisterChild(this.seLabel);
    this.parentAngle.unregisterChild(this.seNSectLine);
  }

  toOpcode(): null | string | Array<string> {
    const targetLine = this.seNSectLine;
    return [
      "AddNSectLine",
      /* arg-1 */ targetLine.name,
      /* arg-2 */ targetLine.startSEPoint.name,
      /* arg-3 */ targetLine.endSEPoint.locationVector.toFixed(7),
      /* arg-4 */ targetLine.normalVector.toFixed(7),
      /* arg-5 */ this.seLabel.name,
      /* arg-6 */ targetLine.showing,
      /* arg-7 */ targetLine.exists,
      /* arg-8 */ this.parentAngle.name,
      /* arg-9 */ this.seNSectLine.index,
      /* arg-10*/ this.seNSectLine.N
    ].join("/");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("/");
    const parentAngle = objMap.get(tokens[8]) as SEAngleMarker | undefined;
    const startPoint = objMap.get(tokens[2]) as SEPoint | undefined;
    if (parentAngle !== undefined && startPoint !== undefined) {
      const endPointPosition = new Vector3();
      endPointPosition.from(tokens[3]);

      const endPoint = new SEPoint(new Point());
      endPoint.locationVector = endPointPosition;
      endPoint.exists = true;
      endPoint.showing = false;

      const normalVector = new Vector3();
      normalVector.from(tokens[4]);

      const newLine = new NonFreeLine();
      newLine.stylize(DisplayStyle.ApplyCurrentVariables);
      newLine.adjustSize();
      const index = Number(tokens[9]);
      const N = Number(tokens[10]);
      const line = new SENSectLine(
        newLine,
        startPoint,
        normalVector,
        endPoint,
        parentAngle,
        index,
        N
      );

      const newLabel = new Label();
      const label = new SELabel(newLabel, line);
      label.locationVector.copy(endPointPosition);
      const offset = SETTINGS.point.initialLabelOffset;
      label.locationVector.add(new Vector3(2 * offset, offset, 0)).normalize();

      line.showing = tokens[6] === "true";
      line.exists = tokens[7] === "true";
      line.name = tokens[1];
      objMap.set(tokens[1], line);
      label.name = tokens[5];
      objMap.set(tokens[5], label);
      return new AddNSectLineCommand(line, parentAngle, label);
    } else {
      throw new Error(
        `AddNSectLine: Parent angle ${tokens[3]} or start SEPoint ${tokens[2]} are undefined`
      );
    }
  }
}
