import { Command } from "@/commands-spherical/Command";
import { HELabel } from "@/models-hyperbolic/HELabel";
// import { Vector3 } from "three";
// import { SavedNames, toSVGType } from "@/types";
// import { HENodule } from "@/models-spherical/HENodule";
// import { StyleCategory } from "@/types/Styles";
import { HEPoint } from "@/models-hyperbolic/HEPoint";

export class AddPointCommand extends Command {
  private hePoint: HEPoint;
  private heLabel: HELabel;
  // private useVisiblePointCountToRename: boolean;
  constructor(
    hePoint: HEPoint,
    heLabel: HELabel
    // useVisiblePointCountToRename?: boolean
  ) {
    super();
    this.hePoint = hePoint;
    this.heLabel = heLabel;
    // if (useVisiblePointCountToRename !== undefined) {
    //   this.useVisiblePointCountToRename = useVisiblePointCountToRename;
    // } else {
    //   this.useVisiblePointCountToRename = true;
    // }
  }

  do(): void {
    Command.hstore.addLabel(this.heLabel);
    this.hePoint.registerChild(this.heLabel);
    Command.hstore.addPoint(this.hePoint);
    // Set the label to display the name of the point in visible count order
    // this.hePoint.pointVisibleBefore = true;
    // this.hePoint.incrementVisiblePointCount();
    // if (this.hePoint.label && this.useVisiblePointCountToRename) {
    //   this.hePoint.label.ref.shortUserName = `P${this.hePoint.visiblePointCount}`;
    //   this.hePoint.label.ref.defaultName = `P${this.hePoint.visiblePointCount}`;
    // }
  }

  saveState(): void {
    this.lastState = this.hePoint.id;
  }

  restoreState(): void {
    // this.hePoint.decrementVisiblePointCount();
    // if (this.hePoint.label && this.useVisiblePointCountToRename) {
    //   this.hePoint.label.ref.defaultName = `P${this.hePoint.visiblePointCount}`;
    //   this.hePoint.label.ref.shortUserName = `P${this.hePoint.visiblePointCount}`;
    // }
    // this.hePoint.pointVisibleBefore = false;
    Command.hstore.removeLabel(this.heLabel);
    this.hePoint.unregisterChild(this.heLabel);
    Command.store.removePoint(this.lastState);
  }

  // getSVGObjectLabelPairs(): [SENodule, SELabel][] {
  //   return [[this.hePoint, this.seLabel]];
  // }

  toOpcode(): null | string | Array<string> {
    return "Not Implemented";
    //   return [
    //     "AddPoint",
    //     // Any attribute that could possibly have a "= or "&" should be run through Command.symbolToASCIIDec
    //     // All plottable objects have these attributes
    //     "objectName=" + Command.symbolToASCIIDec(this.hePoint.name),
    //     "objectExists=" + this.hePoint.exists,
    //     "objectShowing=" + this.hePoint.showing,
    //     "objectFrontStyle=" +
    //       Command.symbolToASCIIDec(
    //         JSON.stringify(
    //           this.hePoint.ref.currentStyleState(StyleCategory.Front)
    //         )
    //       ),
    //     "objectBackStyle=" +
    //       Command.symbolToASCIIDec(
    //         JSON.stringify(this.hePoint.ref.currentStyleState(StyleCategory.Back))
    //       ),
    //     // All labels have these attributes
    //     "labelName=" + Command.symbolToASCIIDec(this.seLabel.name),
    //     "labelStyle=" +
    //       Command.symbolToASCIIDec(
    //         JSON.stringify(
    //           this.seLabel.ref.currentStyleState(StyleCategory.Label)
    //         )
    //       ),
    //     "labelVector=" + this.seLabel.ref._locationVector.toFixed(9),
    //     "labelShowing=" + this.seLabel.showing,
    //     "labelExists=" + this.seLabel.exists,
    //     // Object specific attributes
    //     "pointVector=" + this.hePoint.locationVector.toFixed(9)
    //   ].join("&");
  }

  // static parse(command: string, objMap: Map<string, SENodule>): Command {
  //   const tokens = command.split("&");
  //   const propMap = new Map<SavedNames, string>();
  //   // load the tokens into the map
  //   tokens.forEach((token, ind) => {
  //     if (ind === 0) return; // don't put the command type in the propMap
  //     const parts = token.split("=");
  //     propMap.set(parts[0] as SavedNames, Command.asciiDecToSymbol(parts[1]));
  //   });
  //   //make the point
  //   const sePointLocation = new Vector3();
  //   sePointLocation.from(propMap.get("pointVector")); // convert to vector
  //   const pointFrontStyleString = propMap.get("objectFrontStyle");
  //   const pointBackStyleString = propMap.get("objectBackStyle");
  //   const sePoint = new SEPoint();
  //   sePoint.locationVector = sePointLocation;
  //   // console.debug(`Point front style string ${pointFrontStyleString}`);
  //   if (pointFrontStyleString !== undefined) {
  //     sePoint.updatePlottableStyle(
  //       StyleCategory.Front,
  //       JSON.parse(pointFrontStyleString)
  //     );
  //   }
  //   // console.debug(`Point back style string ${pointBackStyleString}`);
  //   if (pointBackStyleString !== undefined) {
  //     sePoint.updatePlottableStyle(
  //       StyleCategory.Back,
  //       JSON.parse(pointBackStyleString)
  //     );
  //   }

  //   //make the label
  //   const seLabel = new SELabel("point", sePoint);
  //   const seLabelLocation = new Vector3();
  //   seLabelLocation.from(propMap.get("labelVector")); // convert to Number
  //   seLabel.locationVector = seLabelLocation; // Don't use copy() on a prop
  //   const labelStyleString = propMap.get("labelStyle");
  //   // console.debug(`Point label style string ${labelStyleString}`);
  //   if (labelStyleString !== undefined) {
  //     seLabel.updatePlottableStyle(
  //       StyleCategory.Label,
  //       JSON.parse(labelStyleString)
  //     );
  //   }

  //   //put the point in the object map
  //   if (propMap.get("objectName") !== undefined) {
  //     // console.debug(
  //     //   `old name ${sePoint.name}, new name ${propMap.get("objectName")}`
  //     // );
  //     sePoint.name = propMap.get("objectName") ?? "";
  //     sePoint.showing = propMap.get("objectShowing") === "true";
  //     sePoint.exists = propMap.get("objectExists") === "true";
  //     objMap.set(sePoint.name, sePoint);
  //   } else {
  //     throw new Error("AddPoint: Point Name doesn't exist");
  //   }

  //   //put the label in the object map
  //   if (propMap.get("labelName") !== undefined) {
  //     seLabel.name = propMap.get("labelName") ?? "";
  //     seLabel.showing = propMap.get("labelShowing") === "true";
  //     seLabel.exists = propMap.get("labelExists") === "true";
  //     objMap.set(seLabel.name, seLabel);
  //   } else {
  //     throw new Error("AddPoint: Label Name doesn't exist");
  //   }
  //   return new AddPointCommand(
  //     sePoint,
  //     seLabel,
  //     false //The name of this point is set by the saved value and not the visible count
  //   );
  // }
}
