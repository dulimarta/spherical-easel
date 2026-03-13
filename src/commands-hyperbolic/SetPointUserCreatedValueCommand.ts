import { Command } from "@/commands-spherical/Command";
import { SEIntersectionPoint } from "@/models-spherical/SEIntersectionPoint";
import { DisplayStyle } from "@/plottables-spherical/Nodule";
// import { Labelable } from "@/types";
// import { SEPoint } from "@/models-spherical/SEPoint";
import SETTINGS from "@/global-settings-spherical";
// import { SENodule } from "@/models-spherical/SENodule";
// import { SavedNames } from "@/types";
import { SEAntipodalPoint } from "@/models-spherical/SEAntipodalPoint";
import EventBus from "@/eventHandlers-spherical/EventBus";
import { toSVGType } from "@/types";
import { HEIntersectionPoint } from "@/models-hyperbolic/HEIntersectionPoint";
import { HEAntipodalPoint } from "@/models-hyperbolic/HEAntipodalPoint";

/**
 * This is used when an intersection point was automatically created and the user
 * wants to actually use it in a construction. Meaning they want to change the value of
 * isUserCreated, display the point and set up the glowing style
 */
export class SetPointUserCreatedValueCommand extends Command {
  private heIntersectionOrAntipodePoint: HEIntersectionPoint | HEAntipodalPoint;
  private userCreatedValue: boolean;
  // private useVisiblePointCountToRename: boolean;
  constructor(
    heIntersectionOrAntipodePoint: HEIntersectionPoint | HEAntipodalPoint,
    userCreatedValue: boolean,
    useVisiblePointCountToRename?: boolean
  ) {
    super();
    this.heIntersectionOrAntipodePoint = heIntersectionOrAntipodePoint;
    this.userCreatedValue = userCreatedValue;
    // if (useVisiblePointCountToRename !== undefined) {
    //   this.useVisiblePointCountToRename = useVisiblePointCountToRename;
    // } else {
    //   this.useVisiblePointCountToRename = true;
    // }
  }

  do(): void {
    // console.log(
    //   `SetPointUserCreated: DO changed ${this.seIntersectionOrAntipodePoint.name} to user created:${this.userCreatedValue}`
    // );

    this.heIntersectionOrAntipodePoint.isUserCreated = this.userCreatedValue;
    // Set the display to the default values
    // if (this.userCreatedValue) {
    //   this.heIntersectionOrAntipodePoint.ref.stylize(
    //     DisplayStyle.ApplyCurrentVariables
    //   );
    // } else {
    //   this.heIntersectionOrAntipodePoint.ref.stylize(
    //     DisplayStyle.ApplyTemporaryVariables
    //   );
    // }
    // Set the size for the current zoom magnification factor
    // this.heIntersectionOrAntipodePoint.ref.adjustSize();
    this.heIntersectionOrAntipodePoint.showing = this.userCreatedValue;
    // show the label
    // if (
    //   this.heIntersectionOrAntipodePoint.label &&
    //   SETTINGS.point.showLabelsOfNonFreePointsInitially
    // ) {
    //   this.heIntersectionOrAntipodePoint.label.showing = this.userCreatedValue;
    // }
    // if (this.userCreatedValue) {
    //   // Set the label to display the name of the point in visible count order
    //   this.heIntersectionOrAntipodePoint.pointVisibleBefore = true;
    //   if (
    //     this.heIntersectionOrAntipodePoint.label &&
    //     this.useVisiblePointCountToRename
    //   ) {
    //     this.heIntersectionOrAntipodePoint.incrementVisiblePointCount();
    //     this.heIntersectionOrAntipodePoint.label.ref.shortUserName = `P${this.heIntersectionOrAntipodePoint.visiblePointCount}`;
    //   }
    // } else {
    //   if (
    //     this.heIntersectionOrAntipodePoint.label &&
    //     this.useVisiblePointCountToRename
    //   ) {
    //     this.heIntersectionOrAntipodePoint.decrementVisiblePointCount();
    //     this.heIntersectionOrAntipodePoint.label.ref.shortUserName = `P${this.heIntersectionOrAntipodePoint.visiblePointCount}`;
    //   }
    //   this.heIntersectionOrAntipodePoint.pointVisibleBefore = false;
    // }
    this.heIntersectionOrAntipodePoint.markKidsOutOfDate();
    this.heIntersectionOrAntipodePoint.update();
    EventBus.fire("update-points-user-created", {});
  }

  saveState(): void {
    // No additional code required
  }

  restoreState(): void {
    // console.debug(
    //   `SetPointUserCreated: RESTORE changed ${
    //     this.seIntersectionOrAntipodePoint.name
    //   } to user created: ${!this.userCreatedValue}`
    // );
    // if (this.userCreatedValue) {
    //   if (
    //     this.heIntersectionOrAntipodePoint.label &&
    //     this.useVisiblePointCountToRename
    //   ) {
    //     this.heIntersectionOrAntipodePoint.decrementVisiblePointCount();
    //     this.heIntersectionOrAntipodePoint.label.ref.shortUserName = `P${this.heIntersectionOrAntipodePoint.visiblePointCount}`;
    //   }
    //   this.heIntersectionOrAntipodePoint.pointVisibleBefore = false;
    // } else {
    //   // Set the label to display the name of the point in visible count order
    //   this.heIntersectionOrAntipodePoint.pointVisibleBefore = true;
    //   if (
    //     this.heIntersectionOrAntipodePoint.label &&
    //     this.useVisiblePointCountToRename
    //   ) {
    //     this.heIntersectionOrAntipodePoint.incrementVisiblePointCount();
    //     this.heIntersectionOrAntipodePoint.label.ref.shortUserName = `P${this.heIntersectionOrAntipodePoint.visiblePointCount}`;
    //   }
    // }
    // if (
    //   this.heIntersectionOrAntipodePoint.label &&
    //   SETTINGS.point.showLabelsOfNonFreePointsInitially
    // ) {
    //   this.heIntersectionOrAntipodePoint.label.showing = !this.userCreatedValue;
    // }
    // hide the point
    this.heIntersectionOrAntipodePoint.showing = !this.userCreatedValue;
    // revert to temporary status
    // if (!this.userCreatedValue) {
    //   this.heIntersectionOrAntipodePoint.ref.stylize(
    //     DisplayStyle.ApplyCurrentVariables
    //   );
    // } else {
    //   this.heIntersectionOrAntipodePoint.ref.stylize(
    //     DisplayStyle.ApplyTemporaryVariables
    //   );
    // }
    // set back to automatically created
    this.heIntersectionOrAntipodePoint.isUserCreated = !this.userCreatedValue;
    this.heIntersectionOrAntipodePoint.markKidsOutOfDate();
    this.heIntersectionOrAntipodePoint.update();
    EventBus.fire("update-points-user-created", {});
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

  // return [
  //   "ConvertIntersectionToNotUserCreated",
  //   // Any attribute that could possibly have a "=", "@", "&" or "/" should be run through Command.symbolToASCIIDec
  //   // Object specific attributes
  //   "convertToUserCreatedIntersectionPointName=" +
  //     Command.symbolToASCIIDec(this.seIntersectionPoint.name)
  // ].join("&");
  //}

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
  //     return new ConvertUserCreatedInterToNotUserCreatedCommand(
  //       seIntersectionPoint
  //     );
  //   }
  //   throw new Error(
  //     `Convert Intersection To Not User Created Command: SEIntersection point ${seIntersectionPoint} doesn't exist`
  //   );
  // }
}
