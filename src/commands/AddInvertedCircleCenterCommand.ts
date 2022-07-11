import { Command } from "./Command";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import Label from "@/plottables/Label";
import { StyleEditPanels } from "@/types/Styles";
import { SavedNames } from "@/types";
import NonFreePoint from "@/plottables/NonFreePoint";
import { SECircle } from "@/models/SECircle";
import { SELine } from "@/models/SELine";
import { SEInversion } from "@/models/SEInversion";
import { SEInversionCircleCenter } from "@/models/SEInversionCircleCenter";

export class AddInvertedCircleCenterCommand extends Command {
  private preimageSECircleOrLine: SECircle | SELine;
  private parentInversion: SEInversion;
  private invertedSECircleCenter: SEInversionCircleCenter;
  private invertedSECircleCenterLabel: SELabel;

  constructor(
    invertedSECircleCenter: SEInversionCircleCenter,
    invertedSECircleCenterLabel: SELabel,
    preimageSECircleOrLine: SECircle | SELine,
    parentInversion: SEInversion
  ) {
    super();
    this.preimageSECircleOrLine = preimageSECircleOrLine;
    this.invertedSECircleCenter = invertedSECircleCenter;
    this.parentInversion = parentInversion;
    this.invertedSECircleCenterLabel = invertedSECircleCenterLabel;
  }

  do(): void {
    this.preimageSECircleOrLine.registerChild(this.invertedSECircleCenter);
    this.parentInversion.registerChild(this.invertedSECircleCenter);
    this.invertedSECircleCenter.registerChild(this.invertedSECircleCenterLabel);
    Command.store.addPoint(this.invertedSECircleCenter);
    Command.store.addLabel(this.invertedSECircleCenterLabel);
  }

  saveState(): void {
    this.lastState = this.invertedSECircleCenter.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.invertedSECircleCenterLabel.id);
    Command.store.removePoint(this.lastState);
    this.invertedSECircleCenter.unregisterChild(
      this.invertedSECircleCenterLabel
    );
    this.parentInversion.unregisterChild(this.invertedSECircleCenter);
    this.preimageSECircleOrLine.unregisterChild(this.invertedSECircleCenter);
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
              StyleEditPanels.Front
            )
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.invertedSECircleCenter.ref.currentStyleState(
              StyleEditPanels.Back
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
              StyleEditPanels.Label
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
      const pt = new NonFreePoint();
      const inversionSECircleCenterPoint = new SEInversionCircleCenter(
        pt,
        parentSECircleOrLine,
        invertedCircleCenterParentInversion
      );
      //style the point
      const pointFrontStyleString = propMap.get("objectFrontStyle");
      if (pointFrontStyleString !== undefined)
        pt.updateStyle(
          StyleEditPanels.Front,
          JSON.parse(pointFrontStyleString)
        );
      const pointBackStyleString = propMap.get("objectBackStyle");
      if (pointBackStyleString !== undefined)
        pt.updateStyle(StyleEditPanels.Back, JSON.parse(pointBackStyleString));

      //make the label and set its location
      const label = new Label();
      const inversionSECircleCenterLabel = new SELabel(
        label,
        inversionSECircleCenterPoint
      );
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      inversionSECircleCenterLabel.locationVector.copy(seLabelLocation);
      //style the label
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        label.updateStyle(StyleEditPanels.Label, JSON.parse(labelStyleString));

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
        invertedCircleCenterParentInversion
      );
    }
    throw new Error(
      `AddInversionCircleCenter: ${parentSECircleOrLine} or ${invertedCircleCenterParentInversion} is undefined`
    );
  }
}
