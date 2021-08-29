import { Command } from "./Command";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SavedNames, SEOneOrTwoDimensional } from "@/types";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import Point from "@/plottables/Point";
import Label from "@/plottables/Label";
import SETTINGS from "@/global-settings";
import NonFreePoint from "@/plottables/NonFreePoint";
import { StyleEditPanels } from "@/types/Styles";
export class AddIntersectionPointCommand extends Command {
  private sePoint: SEIntersectionPoint;
  private parent1: SEOneOrTwoDimensional;
  private parent2: SEOneOrTwoDimensional;
  private seLabel: SELabel;

  constructor(
    sePoint: SEIntersectionPoint,
    parent1: SEOneOrTwoDimensional,
    parent2: SEOneOrTwoDimensional,
    seLabel: SELabel
  ) {
    super();
    this.sePoint = sePoint;
    this.parent1 = parent1;
    this.parent2 = parent2;
    this.seLabel = seLabel;
  }

  do(): void {
    this.parent1.registerChild(this.sePoint);
    this.parent2.registerChild(this.sePoint);
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
    this.parent1.unregisterChild(this.sePoint);
    this.parent2.unregisterChild(this.sePoint);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddIntersectionPoint",
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
      // Object specific attributes
      "intersectionPointParent1Name=" + this.parent1.name,
      "intersectionPointParent2Name=" + this.parent2.name,
      "intersectionPointUserCreated=" + this.sePoint.isUserCreated,
      "intersectionPointOrder=" + this.sePoint.intersectionOrder,
      "intersectionPointVector=" + this.sePoint.locationVector.toFixed(7)
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
    const parent1 = objMap.get(
      propMap.get("intersectionPointParent1Name") ?? ""
    ) as SEOneOrTwoDimensional | undefined;

    const parent2 = objMap.get(
      propMap.get("intersectionPointParent2Name") ?? ""
    ) as SEOneOrTwoDimensional | undefined;

    const positionVector = new Vector3();
    positionVector.from(propMap.get("intersectionPointVector")); // convert to vector, if .from() fails the vector is set to 0,0,1

    const intersectionOrder = Number(propMap.get("intersectionPointOrder"));

    const intersectionPointUserCreated =
      propMap.get("intersectionPointUserCreated") === "true";

    if (
      parent2 &&
      parent1 &&
      positionVector.z !== 1 &&
      !isNaN(intersectionOrder)
    ) {
      //make the intersection point
      const nonFreePoint = new NonFreePoint();
      const seIntersectionPoint = new SEIntersectionPoint(
        nonFreePoint,
        parent1,
        parent2,
        intersectionOrder,
        intersectionPointUserCreated
      );
      seIntersectionPoint.locationVector = positionVector;
      //style the intersection point
      const intersectionPointFrontStyleString = propMap.get("objectFrontStyle");
      if (intersectionPointFrontStyleString !== undefined)
        nonFreePoint.updateStyle(
          StyleEditPanels.Front,
          JSON.parse(intersectionPointFrontStyleString)
        );
      const intersectionPointBackStyleString = propMap.get("objectBackStyle");
      if (intersectionPointBackStyleString !== undefined)
        nonFreePoint.updateStyle(
          StyleEditPanels.Back,
          JSON.parse(intersectionPointBackStyleString)
        );

      //make the label and set its location
      const label = new Label();
      const seLabel = new SELabel(label, seIntersectionPoint);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      seLabel.locationVector.copy(seLabelLocation);
      //style the label
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        label.updateStyle(StyleEditPanels.Label, JSON.parse(labelStyleString));

      //put the segment in the object map
      if (propMap.get("objectName") !== undefined) {
        seIntersectionPoint.name = propMap.get("objectName") ?? "";
        seIntersectionPoint.showing = propMap.get("objectShowing") === "true";
        seIntersectionPoint.exists = propMap.get("objectExists") === "true";
        objMap.set(seIntersectionPoint.name, seIntersectionPoint);
      } else {
        throw new Error(
          "AddIntersectionPoint: Intersection point Name doesn't exist"
        );
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        seLabel.name = propMap.get("labelName") ?? "";
        seLabel.showing = propMap.get("labelShowing") === "true";
        seLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(seLabel.name, seLabel);
      } else {
        throw new Error("AddIntersectionPoint: Label Name doesn't exist");
      }
      return new AddIntersectionPointCommand(
        seIntersectionPoint,
        parent1,
        parent2,
        seLabel
      );
    }
    throw new Error(
      `AddIntersectionPointCommand: ${parent2}, ${parent1}, ${positionVector}, or ${intersectionOrder}  is undefined`
    );
  }
}
