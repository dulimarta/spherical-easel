import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import { SavedNames } from "@/types";
import { StyleEditPanels } from "@/types/Styles";
import Point from "@/plottables/Point";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
import Label from "@/plottables/Label";

export class AddAntipodalPointCommand extends Command {
  private sePoint: SEPoint;
  private parentSEPoint: SEPoint;
  private seLabel: SELabel;
  constructor(
    sePoint: SEAntipodalPoint,
    parentSEPoint: SEPoint,
    seLabel: SELabel
  ) {
    super();
    this.sePoint = sePoint;
    this.parentSEPoint = parentSEPoint;
    this.seLabel = seLabel;
  }

  do(): void {
    this.parentSEPoint.registerChild(this.sePoint);
    this.sePoint.registerChild(this.seLabel);
    Command.store.addPoint(this.sePoint);
    Command.store.addLabel(this.seLabel);
    this.sePoint.markKidsOutOfDate();
    this.sePoint.update();
  }

  saveState(): void {
    this.lastState = this.sePoint.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removePoint(this.lastState);
    this.sePoint.unregisterChild(this.seLabel);
    this.parentSEPoint.unregisterChild(this.sePoint);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddAntipodalPoint",
      // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.sePoint.name),
      "objectExists=" + this.sePoint.exists,
      "objectShowing=" + this.sePoint.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.sePoint.ref.currentStyleState(StyleEditPanels.Front)
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.sePoint.ref.currentStyleState(StyleEditPanels.Back)
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
      // Object specific attributes necessary for recreating the object
      "pointVector=" + this.sePoint.locationVector.toFixed(7),
      "antipodalPointsParentName=" + this.parentSEPoint.name
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
    const parentPoint = objMap.get(
      propMap.get("antipodalPointsParentName") ?? ""
    ) as SEPoint | undefined;

    if (parentPoint) {
      //make the point
      const point = new Point();
      const sePoint = new SEAntipodalPoint(point, parentPoint);
      const sePointLocation = new Vector3();
      sePointLocation.from(propMap.get("pointVector"));
      sePoint.locationVector.copy(sePointLocation);
      const pointFrontStyleString = propMap.get("objectFrontStyle");
      if (pointFrontStyleString !== undefined)
        point.updateStyle(
          StyleEditPanels.Front,
          JSON.parse(pointFrontStyleString)
        );
      const pointBackStyleString = propMap.get("objectBackStyle");
      if (pointBackStyleString !== undefined)
        point.updateStyle(
          StyleEditPanels.Back,
          JSON.parse(pointBackStyleString)
        );

      //make the label
      const label = new Label();
      const seLabel = new SELabel(label, sePoint);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector"));
      seLabel.locationVector.copy(seLabelLocation);
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        label.updateStyle(StyleEditPanels.Label, JSON.parse(labelStyleString));

      //put the point in the object map
      if (propMap.get("objectName") !== undefined) {
        sePoint.name = propMap.get("objectName") ?? "";
        sePoint.showing = propMap.get("objectShowing") === "true";
        sePoint.exists = propMap.get("objectExists") === "true";
        objMap.set(sePoint.name, sePoint);
      } else {
        throw new Error("AddAntipodalPoint: Point Name doesn't exist");
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        seLabel.name = propMap.get("labelName") ?? "";
        seLabel.showing = propMap.get("labelShowing") === "true";
        seLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(seLabel.name, seLabel);
      } else {
        throw new Error("AddAntipodalPoint: Label Name doesn't exist");
      }
      return new AddAntipodalPointCommand(sePoint, parentPoint, seLabel);
    } else {
      throw new Error(
        `AddAntipodalPoint: parent point ${propMap.get(
          "antipodalPointsParentName"
        )} is undefined`
      );
    }
  }
}
