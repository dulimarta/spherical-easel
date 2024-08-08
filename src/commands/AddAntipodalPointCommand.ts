import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import { SavedNames } from "@/types";
import { StyleCategory } from "@/types/Styles";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
import { toSVGType } from "@/types";


export class AddAntipodalPointCommand extends Command {
  private seAntipodalPoint: SEAntipodalPoint;
  private parentSEPoint: SEPoint;
  private seLabel: SELabel;
  constructor(
    sePoint: SEAntipodalPoint,
    parentSEPoint: SEPoint,
    seLabel: SELabel
  ) {
    super();
    this.seAntipodalPoint = sePoint;
    this.parentSEPoint = parentSEPoint;
    this.seLabel = seLabel;
  }

  do(): void {
    // console.debug(
    //   `AddAntipodalPoint: DO added the point ${this.seAntipodalPoint.name} as the antipode to parent ${this.parentSEPoint.name} it is userCreated: ${this.seAntipodalPoint.isUserCreated}`
    // );
    this.parentSEPoint.registerChild(this.seAntipodalPoint);
    this.seAntipodalPoint.registerChild(this.seLabel);
    Command.store.addPoint(this.seAntipodalPoint);
    Command.store.addLabel(this.seLabel);
    // this.seAntipodalPoint.markKidsOutOfDate();
    // this.seAntipodalPoint.update();
  }

  saveState(): void {
    this.lastState = this.seAntipodalPoint.id;
  }

  restoreState(): void {
    // console.debug(
    //   `AddAntipodalPoint: RESTORE removed the point ${this.seAntipodalPoint.name} as the antipode to parent ${this.parentSEPoint.name} it is userCreated: ${this.seAntipodalPoint.isUserCreated}`
    // );
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removePoint(this.lastState);
    this.seAntipodalPoint.unregisterChild(this.seLabel);
    this.parentSEPoint.unregisterChild(this.seAntipodalPoint);
  }

  getSVGObjectLabelPairs(): [SENodule, SELabel][] {
    return [[this.seAntipodalPoint, this.seLabel]];
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddAntipodalPoint",
      // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seAntipodalPoint.name),
      "objectExists=" + this.seAntipodalPoint.exists,
      "objectShowing=" + this.seAntipodalPoint.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seAntipodalPoint.ref.currentStyleState(StyleCategory.Front)
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seAntipodalPoint.ref.currentStyleState(StyleCategory.Back)
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
      // Object specific attributes necessary for recreating the object
      "pointVector=" + this.seAntipodalPoint.locationVector.toFixed(9),
      "antipodalPointsParentName=" + this.parentSEPoint.name,
      "antipodalPointIsUserCreated=" + this.seAntipodalPoint.isUserCreated
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
      const isUserCreated =
        propMap.get("antipodalPointIsUserCreated") === "true";
      const sePoint = new SEAntipodalPoint(parentPoint, isUserCreated);
      const sePointLocation = new Vector3();
      sePointLocation.from(propMap.get("pointVector"));
      sePoint.locationVector = sePointLocation;
      const pointFrontStyleString = propMap.get("objectFrontStyle");
      if (pointFrontStyleString !== undefined)
        sePoint.updatePlottableStyle(
          StyleCategory.Front,
          JSON.parse(pointFrontStyleString)
        );
      const pointBackStyleString = propMap.get("objectBackStyle");
      if (pointBackStyleString !== undefined)
        sePoint.updatePlottableStyle(
          StyleCategory.Back,
          JSON.parse(pointBackStyleString)
        );

      //make the label
      const seLabel = new SELabel("point", sePoint);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector"));
      seLabel.locationVector = seLabelLocation; // Don't use copy() on a prop
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        seLabel.updatePlottableStyle(
          StyleCategory.Label,
          JSON.parse(labelStyleString)
        );

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
