import { Command } from "./Command";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { toSVGType } from "@/types";
// import { Labelable } from "@/types";
// import { SEPoint } from "@/models/SEPoint";
//import SETTINGS from "@/global-settings";
// import { SENodule } from "@/models/SENodule";
// import { SavedNames } from "@/types";
//import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";

/**
 * This is used when an intersection point was automatically created and the user
 * wants to actually use it in a construction. Meaning they want to change the value of
 * isUserCreated, display the point and set up the glowing style
 */
export class ConvertIntersectionPointToAntipodalMode extends Command {
  private seIntersectionPoint: SEIntersectionPoint;
  private seIntersectionParent: SEIntersectionPoint;
  constructor(
    seIntersectionPoint: SEIntersectionPoint,
    seIntersectionParent: SEIntersectionPoint
  ) {
    super();
    this.seIntersectionPoint = seIntersectionPoint;
    this.seIntersectionParent = seIntersectionParent;
  }

  do(): void {
    // console.debug(
    //   `DO: Convert intersection point ${this.seIntersectionPoint.name} to antipodal mode with parent ${this.seIntersectionParent.name}`
    // );
    this.seIntersectionPoint.antipodalPointId = this.seIntersectionParent.id;
    this.seIntersectionPoint.shallowUpdate();
    // Set the display to the default values
    // this.seIntersectionPoint.ref.stylize(
    //   DisplayStyle.ApplyCurrentVariables
    // );
    // // Set the size for the current zoom magnification factor
    // this.seIntersectionPoint.ref.adjustSize();
    // this.seIntersectionPoint.showing = true;
    // // show the label
    // if (
    //   this.seIntersectionPoint.label != undefined &&
    //   SETTINGS.point.showLabelsOfNonFreePointsInitially
    // ) {
    //   this.seIntersectionPoint.label.showing = true;
    // }
  }

  saveState(): void {
    // No additional code required
  }

  restoreState(): void {
    // console.debug(
    //   `RestoreSate: Convert intersection point ${this.seIntersectionPoint.name} to not antipodal mode`
    // );
    this.seIntersectionPoint.antipodalPointId = -1;
    this.seIntersectionPoint.shallowUpdate();
    // hide the label
    // if (this.seIntersectionPoint.label != undefined) {
    //   this.seIntersectionPoint.label.showing = false;
    // }
    // // hide the point
    // this.seIntersectionPoint.showing = false;
    // // revert to temporary status
    // this.seIntersectionPoint.ref.stylize(DisplayStyle.ApplyTemporaryVariables);
    // // set back to automatically created
    // this.seIntersectionPoint.isUserCreated = false;
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
    // return [
    //   "ConvertIntersectionToUserCreated",
    //   // Any attribute that could possibly have a "=", "@", "&" or "/" should be run through Command.symbolToASCIIDec
    //   // Object specific attributes
    //   "convertToUserCreatedIntersectionPointName=" +
    //     Command.symbolToASCIIDec(this.seIntersectionPoint.name)
    // ].join("&");
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

  //   // get the object specific attributes
  //   const seIntersectionPoint = objMap.get(
  //     propMap.get("changePrincipleParentSEIntersectionPointName") ?? ""
  //   ) as SEIntersectionPoint | undefined;

  //   if (seIntersectionPoint) {
  //     return new ConvertInterPtToUserCreatedCommand(seIntersectionPoint);
  //   }
  //   throw new Error(
  //     `Convert Intersection To User Created Command: SEIntersection point ${seIntersectionPoint} doesn't exist`
  //   );
  // }
}
