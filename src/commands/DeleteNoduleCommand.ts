import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";
import { SELabel } from "@/models/SELabel";
import { SEEllipse } from "@/models/SEEllipse";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SEExpression } from "@/models/SEExpression";
import { SESegmentLength } from "@/models/SESegmentLength";
import { SEPointCoordinate } from "@/models/SEPointCoordinate";
import { SEParametric } from "@/models/SEParametric";
import { SEPolygon } from "@/models/SEPolygon";
import { SETransformation } from "@/models/SETransformation";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SavedNames } from "@/types";
import { toSVGType } from "@/types";
import { SEText } from "@/models/SEText";
import { DisplayStyle } from "@/plottables/Nodule";

export class DeleteNoduleCommand extends Command {
  private seNodule: SENodule;
  private parentIds: number[] = [];

  constructor(seNodule: SENodule) {
    super();
    this.seNodule = seNodule;
    this.seNodule.parents.forEach(nodule => {
      this.parentIds.push(nodule.id);
    });
  }

  deletedNoduleId(): number {
    return 1; //this.seNodule.id
  }

  do(): void {
    // Remove from the Data Structure (DAG)
    // Notice that this makes the parents array empty so that is why we stored the parents ids in a separate
    // array for restore state. Also notice that we can *not* do this with
    // this.seNodule.parents.forEach (obj => obj.unregister(this.seNodule))
    // because unregister modifies the parent array and you never want to modify the parent array while in a forEach
    //
    //This command is always called when there are no children of the
    for (let i = 0; i < this.parentIds.length; i++) {
      const nodule = Command.store.findSENoduleById(this.parentIds[i]);
      if (nodule) {
        nodule.unregisterChild(this.seNodule);
      } else {
        throw (
          `Attempted to unregister child ` +
          `${this.seNodule}` +
          ` from a non-existent nodule with ID ` +
          `${this.parentIds[i]}` +
          ` in the DeleteNoduleCommand`
        );
      }
    }
    // Remove object from the store and turn off the display
    if (this.seNodule instanceof SEPoint) {
      Command.store.removePoint(this.seNodule.id);
    } else if (this.seNodule instanceof SELine) {
      Command.store.removeLine(this.seNodule.id);
    } else if (this.seNodule instanceof SECircle) {
      Command.store.removeCircle(this.seNodule.id);
    } else if (this.seNodule instanceof SEEllipse) {
      Command.store.removeEllipse(this.seNodule.id);
    } else if (this.seNodule instanceof SEParametric) {
      Command.store.removeParametric(this.seNodule.id);
    } else if (this.seNodule instanceof SESegment) {
      Command.store.removeSegment(this.seNodule.id);
    } else if (this.seNodule instanceof SELabel) {
      Command.store.removeLabel(this.seNodule.id);
    } else if (this.seNodule instanceof SEAngleMarker) {
      Command.store.removeAngleMarkerAndExpression(this.seNodule.id);
    } else if (this.seNodule instanceof SEPolygon) {
      Command.store.removePolygonAndExpression(this.seNodule.id);
    } else if (this.seNodule instanceof SEText) {
      Command.store.removeText(this.seNodule.id);
    } else if (this.seNodule instanceof SEExpression) {
      Command.store.removeExpression(this.seNodule.id);
      // when removing expressions that have effects on the labels, we must set those label display arrays to empty
      if (this.seNodule instanceof SESegmentLength) {
        if (this.seNodule.seSegment.label) {
          this.seNodule.seSegment.label.ref.value = [];
        }
      } else if (
        this.seNodule instanceof SEPointCoordinate &&
        Command.store.seExpressions
          .filter(exp => exp instanceof SEPointCoordinate)
          .every(
            exp =>
              (exp as SEPointCoordinate).sePoint.name !==
              (this.seNodule as SEPointCoordinate).sePoint.name
          )
      ) {
        if (this.seNodule.sePoint.label) {
          this.seNodule.sePoint.label.ref.value = [];
        }
      }
    } else if (this.seNodule instanceof SETransformation) {
      Command.store.removeTransformation(this.seNodule.id);
    }
  }

  saveState(): void {
    this.lastState = this.seNodule.id;
  }

  restoreState(): void {
    // Add the object to the store and turn on display
    if (this.seNodule instanceof SETransformation) {
      Command.store.addTransformation(this.seNodule);
    } else if (this.seNodule instanceof SEPolygon) {
      Command.store.addPolygonAndExpression(this.seNodule);
    } else if (this.seNodule instanceof SEAngleMarker) {
      Command.store.addAngleMarkerAndExpression(this.seNodule);
    } else if (this.seNodule instanceof SEExpression) {
      Command.store.addExpression(this.seNodule);
    } else if (this.seNodule instanceof SELabel) {
      Command.store.addLabel(this.seNodule);
    } else if (this.seNodule instanceof SESegment) {
      Command.store.addSegment(this.seNodule);
    } else if (this.seNodule instanceof SEParametric) {
      Command.store.addParametric(this.seNodule);
    } else if (this.seNodule instanceof SEEllipse) {
      Command.store.addEllipse(this.seNodule);
    } else if (this.seNodule instanceof SECircle) {
      Command.store.addCircle(this.seNodule);
    } else if (this.seNodule instanceof SELine) {
      Command.store.addLine(this.seNodule);
    } else if (this.seNodule instanceof SEPoint) {
      Command.store.addPoint(this.seNodule);
    } else if (this.seNodule instanceof SEText) {
      Command.store.addText(this.seNodule);
    }
    // The parent array of this.seNodule is empty prior to the execution of this loop
    for (let i = this.parentIds.length - 1; i > -1; i--) {
      const nodule = Command.store.findSENoduleById(this.parentIds[i]);
      if (nodule) {
        nodule.registerChild(this.seNodule);
      } else {
        throw (
          `Attempted to register child` +
          `${this.seNodule}` +
          `to a non-existent nodule with ID` +
          `${this.parentIds[i]}` +
          `in the DeleteNoduleCommand`
        );
      }
    }
  }

  toOpcode(): null | string | Array<string> {
    return [
      "DeleteNodule",
      // Any attribute that could possibly have a "=", "@", "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seNodule.name)
    ].join("&");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("&");
    const propMap = new Map<SavedNames, string>();
    // load the tokens into the map
    tokens.forEach((token, ind) => {
      if (ind === 0) return; // don't put the command type in the propMap
      const parts = token.split("=");
      propMap.set(parts[0] as SavedNames, Command.asciiDecToSymbol(parts[1]));
    });

    // get the object specific attributes
    const nodule = objMap.get(propMap.get("objectName") ?? "");

    if (nodule) {
      return new DeleteNoduleCommand(nodule);
    }
    throw new Error(`DeleteNoduleCommand: nodule is undefined`);
  }
}
