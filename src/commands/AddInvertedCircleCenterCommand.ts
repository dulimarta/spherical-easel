import { Command } from "./Command";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import { StyleCategory } from "@/types/Styles";
import { SavedNames } from "@/types";
import { SECircle } from "@/models/SECircle";
import { SELine } from "@/models/SELine";
import { SEInversion } from "@/models/SEInversion";
import { SEInversionCircleCenter } from "@/models/SEInversionCircleCenter";
import { toSVGType } from "@/types";

export class AddInvertedCircleCenterCommand extends Command {
  private preimageSECircleOrLine: SECircle | SELine;
  private parentInversion: SEInversion;
  private invertedSECircleCenter: SEInversionCircleCenter;
  private invertedSECircleCenterLabel: SELabel;
  private useVisiblePointCountToRename: boolean;

  constructor(
    invertedSECircleCenter: SEInversionCircleCenter,
    invertedSECircleCenterLabel: SELabel,
    preimageSECircleOrLine: SECircle | SELine,
    parentInversion: SEInversion,
    useVisiblePointCountToRename?: boolean
  ) {
    super();
    this.preimageSECircleOrLine = preimageSECircleOrLine;
    this.invertedSECircleCenter = invertedSECircleCenter;
    this.parentInversion = parentInversion;
    this.invertedSECircleCenterLabel = invertedSECircleCenterLabel;
    if (useVisiblePointCountToRename !== undefined) {
      this.useVisiblePointCountToRename = useVisiblePointCountToRename;
    } else {
      this.useVisiblePointCountToRename = true;
    }
  }

  do(): void {
    this.preimageSECircleOrLine.registerChild(this.invertedSECircleCenter);
    this.parentInversion.registerChild(this.invertedSECircleCenter);
    this.invertedSECircleCenter.registerChild(this.invertedSECircleCenterLabel);
    Command.store.addPoint(this.invertedSECircleCenter);
    Command.store.addLabel(this.invertedSECircleCenterLabel);
    // Set the label to display the name of the point in visible count order
    this.invertedSECircleCenter.pointVisibleBefore = true;
    if (
      this.invertedSECircleCenter.label &&
      this.useVisiblePointCountToRename
    ) {
      this.invertedSECircleCenter.incrementVisiblePointCount();
      this.invertedSECircleCenter.label.ref.shortUserName = `P${this.invertedSECircleCenter.visiblePointCount}`;
    }
  }

  saveState(): void {
    this.lastState = this.invertedSECircleCenter.id;
  }

  restoreState(): void {
    if (
      this.invertedSECircleCenter.label &&
      this.useVisiblePointCountToRename
    ) {
      this.invertedSECircleCenter.decrementVisiblePointCount();
      this.invertedSECircleCenter.label.ref.shortUserName = `P${this.invertedSECircleCenter.visiblePointCount}`;
    }
    this.invertedSECircleCenter.pointVisibleBefore = false;
    Command.store.removeLabel(this.invertedSECircleCenterLabel.id);
    Command.store.removePoint(this.lastState);
    this.invertedSECircleCenter.unregisterChild(
      this.invertedSECircleCenterLabel
    );
    this.parentInversion.unregisterChild(this.invertedSECircleCenter);
    this.preimageSECircleOrLine.unregisterChild(this.invertedSECircleCenter);
  }

  getSVGObjectLabelPairs(): [SENodule, SELabel][] {
    return [[this.invertedSECircleCenter, this.invertedSECircleCenterLabel]];
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddInvertedCircleCenter",
      // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" +
        Command.symbolToASCIIDec(this.invertedSECircleCenter.name),
      "objectExists=" + this.invertedSECircleCenter.exists,
      "objectShowing=" + this.invertedSECircleCenter.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.invertedSECircleCenter.ref.currentStyleState(
              StyleCategory.Front
            )
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.invertedSECircleCenter.ref.currentStyleState(
              StyleCategory.Back
            )
          )
        ),
      // All labels have these attributes
      "labelName=" +
        Command.symbolToASCIIDec(this.invertedSECircleCenterLabel.name),
      "labelStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.invertedSECircleCenterLabel.ref.currentStyleState(
              StyleCategory.Label
            )
          )
        ),
      "labelVector=" +
        this.invertedSECircleCenterLabel.ref._locationVector.toFixed(9),
      "labelShowing=" + this.invertedSECircleCenterLabel.showing,
      "labelExists=" + this.invertedSECircleCenterLabel.exists,
      // Object specific attributes
      "invertedCircleCenterLineOrCircleParentName=" +
        this.preimageSECircleOrLine.name,
      "invertedCircleCenterParentInversionName=" + this.parentInversion.name
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
    const parentSECircleOrLine = objMap.get(
      propMap.get("invertedCircleCenterLineOrCircleParentName") ?? ""
    ) as SECircle | SELine | undefined;

    const invertedCircleCenterParentInversion = objMap.get(
      propMap.get("invertedCircleCenterParentInversionName") ?? ""
    ) as SEInversion | undefined;
    if (parentSECircleOrLine && invertedCircleCenterParentInversion) {
      //make the point
      const inversionSECircleCenterPoint = new SEInversionCircleCenter(
        parentSECircleOrLine,
        invertedCircleCenterParentInversion
      );
      //style the point
      const pointFrontStyleString = propMap.get("objectFrontStyle");
      if (pointFrontStyleString !== undefined)
        inversionSECircleCenterPoint.updatePlottableStyle(
          StyleCategory.Front,
          JSON.parse(pointFrontStyleString)
        );
      const pointBackStyleString = propMap.get("objectBackStyle");
      if (pointBackStyleString !== undefined)
        inversionSECircleCenterPoint.updatePlottableStyle(
          StyleCategory.Back,
          JSON.parse(pointBackStyleString)
        );

      //make the label and set its location
      const inversionSECircleCenterLabel = new SELabel(
        "point",
        inversionSECircleCenterPoint
      );
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      inversionSECircleCenterLabel.locationVector = seLabelLocation; // Don't use copy on a prop
      //style the label
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        inversionSECircleCenterLabel.updatePlottableStyle(
          StyleCategory.Label,
          JSON.parse(labelStyleString)
        );

      //put the inverted circle center point in the object map
      if (propMap.get("objectName") !== undefined) {
        inversionSECircleCenterPoint.name = propMap.get("objectName") ?? "";
        inversionSECircleCenterPoint.showing =
          propMap.get("objectShowing") === "true";
        inversionSECircleCenterPoint.exists =
          propMap.get("objectExists") === "true";
        objMap.set(
          inversionSECircleCenterPoint.name,
          inversionSECircleCenterPoint
        );
      } else {
        throw new Error(
          "AddInvertedSECircleCenter: Center Point Name doesn't exist"
        );
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        inversionSECircleCenterLabel.name = propMap.get("labelName") ?? "";
        inversionSECircleCenterLabel.showing =
          propMap.get("labelShowing") === "true";
        inversionSECircleCenterLabel.exists =
          propMap.get("labelExists") === "true";
        objMap.set(
          inversionSECircleCenterLabel.name,
          inversionSECircleCenterLabel
        );
      } else {
        throw new Error("AddInvertedSECircleCenter: Label Name doesn't exist");
      }
      return new AddInvertedCircleCenterCommand(
        inversionSECircleCenterPoint,
        inversionSECircleCenterLabel,
        parentSECircleOrLine,
        invertedCircleCenterParentInversion,
        false //The name of this point is set by the saved value and not the visible count
      );
    }
    throw new Error(
      `AddInversionCircleCenter: ${parentSECircleOrLine} or ${invertedCircleCenterParentInversion} is undefined`
    );
  }
}
