import { Command } from "./Command";
import { SECircle } from "@/models/SECircle";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import Circle from "@/plottables/Circle";
import { Matrix4, Vector3 } from "three";
import { DisplayStyle } from "@/plottables/Nodule";
import Label from "@/plottables/Label";
import SETTINGS from "@/global-settings";
import { StyleEditPanels } from "@/types/Styles";
import { SavedNames } from "@/types";

export class AddCircleCommand extends Command {
  private seCircle: SECircle;
  private centerSEPoint: SEPoint;
  private circleSEPoint: SEPoint;
  private seLabel: SELabel;
  constructor(
    seCircle: SECircle,
    centerSEPoint: SEPoint,
    circleSEPoint: SEPoint,
    seLabel: SELabel
  ) {
    super();
    this.seCircle = seCircle;
    this.centerSEPoint = centerSEPoint;
    this.circleSEPoint = circleSEPoint;
    this.seLabel = seLabel;
  }

  do(): void {
    this.centerSEPoint.registerChild(this.seCircle);
    this.circleSEPoint.registerChild(this.seCircle);
    this.seCircle.registerChild(this.seLabel);
    Command.store.addCircle(this.seCircle);
    Command.store.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.seCircle.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removeCircle(this.lastState);
    this.seCircle.unregisterChild(this.seLabel);
    this.centerSEPoint.unregisterChild(this.seCircle);
    this.circleSEPoint.unregisterChild(this.seCircle);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddCircle",
      // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seCircle.name),
      "objectExists=" + this.seCircle.exists,
      "objectShowing=" + this.seCircle.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seCircle.ref.currentStyleState(StyleEditPanels.Front)
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seCircle.ref.currentStyleState(StyleEditPanels.Back)
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
      "circleCenterPointName=" + this.centerSEPoint.name,
      "circlePointOnCircleName=" + this.circleSEPoint.name
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
    const circleCenterPoint = objMap.get(
      propMap.get("circleCenterPointName") ?? ""
    ) as SEPoint | undefined;

    const circlePoint = objMap.get(
      propMap.get("circlePointOnCircleName") ?? ""
    ) as SEPoint | undefined;

    if (circleCenterPoint && circlePoint) {
      //make the circle
      const circle = new Circle();
      const seCircle = new SECircle(circle, circleCenterPoint, circlePoint);
      //style the circle
      const circleFrontStyleString = propMap.get("objectFrontStyle");
      if (circleFrontStyleString !== undefined)
        circle.updateStyle(
          StyleEditPanels.Front,
          JSON.parse(circleFrontStyleString)
        );
      const circleBackStyleString = propMap.get("objectBackStyle");
      if (circleBackStyleString !== undefined)
        circle.updateStyle(
          StyleEditPanels.Back,
          JSON.parse(circleBackStyleString)
        );

      //make the label and set its location
      const label = new Label();
      const seLabel = new SELabel(label, seCircle);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      seLabel.locationVector.copy(seLabelLocation);
      //style the label
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        label.updateStyle(StyleEditPanels.Label, JSON.parse(labelStyleString));

      //put the circle in the object map
      if (propMap.get("objectName") !== undefined) {
        seCircle.name = propMap.get("objectName") ?? "";
        seCircle.showing = propMap.get("objectShowing") === "true";
        seCircle.exists = propMap.get("objectExists") === "true";
        objMap.set(seCircle.name, seCircle);
      } else {
        throw new Error("AddCircle: Circle Name doesn't exist");
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        seLabel.name = propMap.get("labelName") ?? "";
        seLabel.showing = propMap.get("labelShowing") === "true";
        seLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(seLabel.name, seLabel);
      } else {
        throw new Error("AddCircle: Label Name doesn't exist");
      }
      return new AddCircleCommand(
        seCircle,
        circleCenterPoint,
        circlePoint,
        seLabel
      );
    }
    throw new Error(
      `AddCircle: ${circleCenterPoint} or ${circlePoint} is undefined`
    );
  }
}
