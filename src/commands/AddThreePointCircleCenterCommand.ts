import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import { StyleCategory } from "@/types/Styles";
import { SavedNames } from "@/types";
import { SEThreePointCircleCenter } from "@/models/SEThreePointCircleCenter";
import { toSVGType } from "@/types";

export class AddThreePointCircleCenterCommand extends Command {
  private seThreePointCircleCenter: SEThreePointCircleCenter;
  private firstSEPoint: SEPoint;
  private secondSEPoint: SEPoint;
  private thirdSEPoint: SEPoint;
  private seLabel: SELabel;
  private useVisiblePointCountToRename: boolean;
  constructor(
    seThreePointCircleCenter: SEThreePointCircleCenter,
    firstSEPoint: SEPoint,
    secondSEPoint: SEPoint,
    thirdSEPoint: SEPoint,
    seLabel: SELabel,
    useVisiblePointCountToRename?: boolean
  ) {
    super();
    this.seThreePointCircleCenter = seThreePointCircleCenter;
    this.firstSEPoint = firstSEPoint;
    this.secondSEPoint = secondSEPoint;
    this.thirdSEPoint = thirdSEPoint;
    this.seLabel = seLabel;
    if (useVisiblePointCountToRename !== undefined) {
      this.useVisiblePointCountToRename = useVisiblePointCountToRename;
    } else {
      this.useVisiblePointCountToRename = true;
    }
  }

  do(): void {
    this.firstSEPoint.registerChild(this.seThreePointCircleCenter);
    this.secondSEPoint.registerChild(this.seThreePointCircleCenter);
    this.thirdSEPoint.registerChild(this.seThreePointCircleCenter);
    Command.store.addPoint(this.seThreePointCircleCenter);
    Command.store.addLabel(this.seLabel);
    // Set the label to display the name of the points in visible count order
    this.seThreePointCircleCenter.pointVisibleBefore = true;
    if (
      this.seThreePointCircleCenter.label &&
      this.useVisiblePointCountToRename
    ) {
      this.seThreePointCircleCenter.incrementVisiblePointCount();
      this.seThreePointCircleCenter.label.ref.shortUserName = `P${this.seThreePointCircleCenter.visiblePointCount}`;
    }
  }

  saveState(): void {
    this.lastState = this.seThreePointCircleCenter.id;
  }

  restoreState(): void {
    if (
      this.seThreePointCircleCenter.label &&
      this.useVisiblePointCountToRename
    ) {
      this.seThreePointCircleCenter.decrementVisiblePointCount();
      this.seThreePointCircleCenter.label.ref.shortUserName = `P${this.seThreePointCircleCenter.visiblePointCount}`;
    }
    this.seThreePointCircleCenter.pointVisibleBefore = false;
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removePoint(this.lastState);
    this.thirdSEPoint.unregisterChild(this.seThreePointCircleCenter);
    this.secondSEPoint.unregisterChild(this.seThreePointCircleCenter);
    this.firstSEPoint.unregisterChild(this.seThreePointCircleCenter);
  }

  toSVG(deletedNoduleIds: Array<number>): null | toSVGType[]{
    // First check to make sure that the object is not deleted, is showing, and exists (otherwise return null)
    //

    return null
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddThreePointCircleCenter",
      // Any attribute that could possibly have a "=" or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" +
        Command.symbolToASCIIDec(this.seThreePointCircleCenter.name),
      "objectExists=" + this.seThreePointCircleCenter.exists,
      "objectShowing=" + this.seThreePointCircleCenter.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seThreePointCircleCenter.ref.currentStyleState(
              StyleCategory.Front
            )
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seThreePointCircleCenter.ref.currentStyleState(
              StyleCategory.Back
            )
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
      "threePointCircleParentPoint1Name=" +
        Command.symbolToASCIIDec(this.firstSEPoint.name),
      "threePointCircleParentPoint2Name=" +
        Command.symbolToASCIIDec(this.secondSEPoint.name),
      "threePointCircleParentPoint3Name=" +
        Command.symbolToASCIIDec(this.thirdSEPoint.name)
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
    const sePoint1 = objMap.get(
      propMap.get("threePointCircleParentPoint1Name") ?? ""
    ) as SEPoint | undefined;

    const sePoint2 = objMap.get(
      propMap.get("threePointCircleParentPoint2Name") ?? ""
    ) as SEPoint | undefined;

    const sePoint3 = objMap.get(
      propMap.get("threePointCircleParentPoint3Name") ?? ""
    ) as SEPoint | undefined;

    if (sePoint1 && sePoint2 && sePoint3) {
      const seThreePointCircleCenter = new SEThreePointCircleCenter(
        sePoint1,
        sePoint2,
        sePoint3
      );
      //style the center
      const centerPointFrontStyleString = propMap.get("objectFrontStyle");
      if (centerPointFrontStyleString !== undefined)
        seThreePointCircleCenter.updatePlottableStyle(
          StyleCategory.Front,
          JSON.parse(centerPointFrontStyleString)
        );
      const centerPointBackStyleString = propMap.get("objectBackStyle");
      if (centerPointBackStyleString !== undefined)
        seThreePointCircleCenter.updatePlottableStyle(
          StyleCategory.Back,
          JSON.parse(centerPointBackStyleString)
        );

      //make the label and set its location
      const seLabel = new SELabel("point", seThreePointCircleCenter);
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

      //put the center point in the object map
      if (propMap.get("objectName") !== undefined) {
        seThreePointCircleCenter.name = propMap.get("objectName") ?? "";
        seThreePointCircleCenter.showing =
          propMap.get("objectShowing") === "true";
        seThreePointCircleCenter.exists =
          propMap.get("objectExists") === "true";
        objMap.set(seThreePointCircleCenter.name, seThreePointCircleCenter);
      } else {
        throw new Error(
          "AddThreePointCircleCenter: Center point name doesn't exist"
        );
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        seLabel.name = propMap.get("labelName") ?? "";
        seLabel.showing = propMap.get("labelShowing") === "true";
        seLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(seLabel.name, seLabel);
      } else {
        throw new Error("AddThreePointCircleCenter: Label Name doesn't exist");
      }
      return new AddThreePointCircleCenterCommand(
        seThreePointCircleCenter,
        sePoint1,
        sePoint2,
        sePoint3,
        seLabel,
        false //The name of this point is set by the saved value and not the visible count
      );
    }
    throw new Error(
      `AddThreePointCircleCenter: ${sePoint1}, ${sePoint2},or ${sePoint3}  is undefined`
    );
  }
}
