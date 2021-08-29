import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SavedNames, SEOneOrTwoDimensional } from "@/types";
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
import NonFreePoint from "@/plottables/NonFreePoint";
import { StyleEditPanels } from "@/types/Styles";

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
    this.sePolarPoint.markKidsOutOfDate();
    this.sePolarPoint.update();
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
      // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.sePolarPoint.name),
      "objectExists=" + this.sePolarPoint.exists,
      "objectShowing=" + this.sePolarPoint.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.sePolarPoint.ref.currentStyleState(StyleEditPanels.Front)
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.sePolarPoint.ref.currentStyleState(StyleEditPanels.Back)
          )
        ),
      // All labels have these attributes
      "labelName=" + Command.symbolToASCIIDec(this.seLabel.name),
      "labelStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seLabel.ref.currentStyleState(StyleEditPanels.Label)
          )
        ),
      "labelVector=" + this.seLabel.ref._locationVector.toFixed(7),
      "labelShowing=" + this.seLabel.showing,
      "labelExists=" + this.seLabel.exists,
      // Object specific attributes
      "polarPointVector=" + this.sePolarPoint.locationVector.toFixed(7),
      "polarPointParentName=" + this.parent.name,
      "polarPointIndex=" + this.index
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
    const sePolarPointParent = objMap.get(
      propMap.get("polarPointParentName") ?? ""
    ) as SELine | SESegment | undefined;

    const sePolarPointVector = new Vector3();
    sePolarPointVector.from(propMap.get("polarPointVector"));

    const sePolarPointIndex = Number(propMap.get("polarPointIndex"));

    if (
      sePolarPointParent &&
      sePolarPointVector.z !== 1 &&
      !isNaN(sePolarPointIndex)
    ) {
      //make the Polar Point
      const point = new NonFreePoint();
      const sePolarPoint = new SEPolarPoint(
        point,
        sePolarPointParent,
        sePolarPointIndex
      );
      //style the Polar Point
      const polarPointFrontStyleString = propMap.get("objectFrontStyle");
      if (polarPointFrontStyleString !== undefined)
        point.updateStyle(
          StyleEditPanels.Front,
          JSON.parse(polarPointFrontStyleString)
        );
      const polarPointBackStyleString = propMap.get("objectBackStyle");
      if (polarPointBackStyleString !== undefined)
        point.updateStyle(
          StyleEditPanels.Back,
          JSON.parse(polarPointBackStyleString)
        );

      //make the label and set its location
      const label = new Label();
      const seLabel = new SELabel(label, sePolarPoint);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      seLabel.locationVector.copy(seLabelLocation);
      //style the label
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        label.updateStyle(StyleEditPanels.Label, JSON.parse(labelStyleString));

      //put the circle in the object map
      if (propMap.get("objectName") !== undefined) {
        sePolarPoint.name = propMap.get("objectName") ?? "";
        sePolarPoint.showing = propMap.get("objectShowing") === "true";
        sePolarPoint.exists = propMap.get("objectExists") === "true";
        objMap.set(sePolarPoint.name, sePolarPoint);
      } else {
        throw new Error("AddPolarPoint: PolarPoint Name doesn't exist");
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        seLabel.name = propMap.get("labelName") ?? "";
        seLabel.showing = propMap.get("labelShowing") === "true";
        seLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(seLabel.name, seLabel);
      } else {
        throw new Error("AddPolarPoint: Label Name doesn't exist");
      }
      return new AddPolarPointCommand(
        sePolarPoint,
        sePolarPointIndex,
        sePolarPointParent,
        seLabel
      );
    }
    throw new Error(
      `AddPolarPoint: ${sePolarPointVector}, ${sePolarPointIndex}, or ${sePolarPointParent}  is undefined`
    );
  }
}
