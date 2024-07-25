import { Command } from "./Command";
import { SavedNames } from "@/types";
import { SELabel } from "@/models/SELabel";
import SETTINGS from "@/global-settings";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import { SESegment } from "@/models/SESegment";
import { SENSectPoint } from "@/models/SENSectPoint";
import { StyleCategory } from "@/types/Styles";
import { toSVGType } from "@/types";

export class AddNSectPointCommand extends Command {
  private seNSectPoint: SENSectPoint;
  private parentSegment: SESegment;
  private seLabel: SELabel;
  private useVisiblePointCountToRename: boolean;
  constructor(
    seNSectPoint: SENSectPoint,
    parentSegment: SESegment,
    seLabel: SELabel,
    useVisiblePointCountToRename?: boolean
  ) {
    super();
    this.seNSectPoint = seNSectPoint;
    this.parentSegment = parentSegment;
    this.seLabel = seLabel;
    if (useVisiblePointCountToRename !== undefined) {
      this.useVisiblePointCountToRename = useVisiblePointCountToRename;
    } else {
      this.useVisiblePointCountToRename = true;
    }
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
    this.seNSectPoint.pointVisibleBefore = true;
    // Set the label to display the name of the point in visible count order
    this.seNSectPoint.incrementVisiblePointCount();
    if (this.seNSectPoint.label && this.useVisiblePointCountToRename) {
      this.seNSectPoint.label.ref.shortUserName = `P${this.seNSectPoint.visiblePointCount}`;
    }
    // this.seNSectPoint.markKidsOutOfDate();
    // this.seNSectPoint.update();
  }

  saveState(): void {
    this.lastState = this.seNSectPoint.id;
  }

  restoreState(): void {
    this.seNSectPoint.decrementVisiblePointCount();
    if (this.seNSectPoint.label && this.useVisiblePointCountToRename) {
      this.seNSectPoint.label.ref.shortUserName = `P${this.seNSectPoint.visiblePointCount}`;
    }
    this.seNSectPoint.pointVisibleBefore = false;
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removePoint(this.lastState);
    this.seNSectPoint.unregisterChild(this.seLabel);
    this.parentSegment.unregisterChild(this.seNSectPoint);
  }

  getSVGObjectLabelPairs(): [SENodule, SELabel][] {
    return [[this.seNSectPoint, this.seLabel]];
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddNSectPoint",
      // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seNSectPoint.name),
      "objectExists=" + this.seNSectPoint.exists,
      "objectShowing=" + this.seNSectPoint.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seNSectPoint.ref.currentStyleState(StyleCategory.Front)
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seNSectPoint.ref.currentStyleState(StyleCategory.Back)
          )
        ),
      // All labels have these attributes
      "labelName=" + Command.symbolToASCIIDec(this.seLabel.name),
      "labelStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seLabel.ref.currentStyleState(StyleCategory.Label)
          )
        ),
      "labelVector=" + this.seLabel.ref._locationVector.toFixed(9),
      "labelShowing=" + this.seLabel.showing,
      "labelExists=" + this.seLabel.exists,
      // Object specific attributes
      "seNSectPointVector=" + this.seNSectPoint.locationVector.toFixed(9),
      "seNSectPointParentSegmentName=" + this.parentSegment.name,
      "seNSectPointIndex=" + this.seNSectPoint.index,
      "seNSectPointN=" + this.seNSectPoint.N
    ].join("&");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    // console.log(command);
    const tokens = command.split("&");
    const propMap = new Map<SavedNames, string>();
    // load the tokens into the map
    tokens.forEach((token, ind) => {
      if (ind === 0) return; // don't put the command type in the propMap
      const parts = token.split("=");
      propMap.set(parts[0] as SavedNames, Command.asciiDecToSymbol(parts[1]));
    });

    // get the object specific attributes
    const seNSectPointParentSegment = objMap.get(
      propMap.get("seNSectPointParentSegmentName") ?? ""
    ) as SESegment | undefined;

    const seNSectPointVector = new Vector3();
    seNSectPointVector.from(propMap.get("seNSectPointVector"));

    const seNSectPointIndex = Number(propMap.get("seNSectPointIndex"));
    const seNSectPointN = Number(propMap.get("seNSectPointN"));

    if (
      seNSectPointParentSegment &&
      seNSectPointVector.z !== 1 &&
      !isNaN(seNSectPointIndex) &&
      !isNaN(seNSectPointN)
    ) {
      //make the Nsect Point
      const seNSectPoint = new SENSectPoint(
        seNSectPointParentSegment,
        seNSectPointIndex,
        seNSectPointN
      );
      //style the NSect Point
      const nSectPointFrontStyleString = propMap.get("objectFrontStyle");
      if (nSectPointFrontStyleString !== undefined)
        seNSectPoint.updatePlottableStyle(
          StyleCategory.Front,
          JSON.parse(nSectPointFrontStyleString)
        );
      const nSectPointBackStyleString = propMap.get("objectBackStyle");
      if (nSectPointBackStyleString !== undefined)
        seNSectPoint.updatePlottableStyle(
          StyleCategory.Back,
          JSON.parse(nSectPointBackStyleString)
        );

      //make the label and set its location
      const seLabel = new SELabel("point", seNSectPoint);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      seLabel.locationVector.copy(seLabelLocation);
      //style the label
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        seLabel.updatePlottableStyle(
          StyleCategory.Label,
          JSON.parse(labelStyleString)
        );

      //put the circle in the object map
      if (propMap.get("objectName") !== undefined) {
        seNSectPoint.name = propMap.get("objectName") ?? "";
        seNSectPoint.showing = propMap.get("objectShowing") === "true";
        seNSectPoint.exists = propMap.get("objectExists") === "true";
        objMap.set(seNSectPoint.name, seNSectPoint);
      } else {
        throw new Error("AddNSectPoint: NSectPoint Name doesn't exist");
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        seLabel.name = propMap.get("labelName") ?? "";
        seLabel.showing = propMap.get("labelShowing") === "true";
        seLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(seLabel.name, seLabel);
      } else {
        throw new Error("AddNSectPoint: Label Name doesn't exist");
      }
      return new AddNSectPointCommand(
        seNSectPoint,
        seNSectPointParentSegment,
        seLabel,
        false //The name of this point is set by the saved value and not the visible count
      );
    }
    throw new Error(
      `AddNSectPoint: ${seNSectPointVector}, ${seNSectPointIndex}, ${seNSectPointN}, or ${seNSectPointParentSegment}  is undefined`
    );
  }
}
