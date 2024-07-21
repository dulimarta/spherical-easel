import { Command } from "./Command";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { DisplayStyle } from "@/plottables/Nodule";
// import { Labelable } from "@/types";
// import { SEPoint } from "@/models/SEPoint";
import SETTINGS from "@/global-settings";
// import { SENodule } from "@/models/SENodule";
// import { SavedNames } from "@/types";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
import EventBus from "@/eventHandlers/EventBus";
import { toSVGType } from "@/types";

/**
 * This is used when an intersection point was automatically created and the user
 * wants to actually use it in a construction. Meaning they want to change the value of
 * isUserCreated, display the point and set up the glowing style
 */
export class SetPointUserCreatedValueCommand extends Command {
  private seIntersectionOrAntipodePoint: SEIntersectionPoint | SEAntipodalPoint;
  private userCreatedValue: boolean;
  private useVisiblePointCountToRename: boolean;
  constructor(
    seIntersectionOrAntipodePoint: SEIntersectionPoint | SEAntipodalPoint,
    userCreatedValue: boolean,
    useVisiblePointCountToRename?: boolean
  ) {
    super();
    this.seIntersectionOrAntipodePoint = seIntersectionOrAntipodePoint;
    this.userCreatedValue = userCreatedValue;
    if (useVisiblePointCountToRename !== undefined) {
      this.useVisiblePointCountToRename = useVisiblePointCountToRename;
    } else {
      this.useVisiblePointCountToRename = true;
    }
  }

  do(): void {
    // console.debug(
    //   `SetPointUserCreated: DO changed ${this.seIntersectionOrAntipodePoint.name} to user created:${this.userCreatedValue}`
    // );
    // if (this.userCreatedValue) {
    this.seIntersectionOrAntipodePoint.isUserCreated = this.userCreatedValue;
    // Set the display to the default values
    this.seIntersectionOrAntipodePoint.ref.stylize(
      DisplayStyle.ApplyCurrentVariables
    );
    // Set the size for the current zoom magnification factor
    this.seIntersectionOrAntipodePoint.ref.adjustSize();
    this.seIntersectionOrAntipodePoint.showing = this.userCreatedValue;
    // show the label
    if (
      this.seIntersectionOrAntipodePoint.label &&
      SETTINGS.point.showLabelsOfNonFreePointsInitially
    ) {
      this.seIntersectionOrAntipodePoint.label.showing = this.userCreatedValue;
    }
    if (this.userCreatedValue) {
      // Set the label to display the name of the point in visible count order
      this.seIntersectionOrAntipodePoint.pointVisibleBefore = true;
      if (
        this.seIntersectionOrAntipodePoint.label &&
        this.useVisiblePointCountToRename
      ) {
        this.seIntersectionOrAntipodePoint.incrementVisiblePointCount();
        this.seIntersectionOrAntipodePoint.label.ref.shortUserName = `P${this.seIntersectionOrAntipodePoint.visiblePointCount}`;
      }
    } else {
      if (
        this.seIntersectionOrAntipodePoint.label &&
        this.useVisiblePointCountToRename
      ) {
        this.seIntersectionOrAntipodePoint.decrementVisiblePointCount();
        this.seIntersectionOrAntipodePoint.label.ref.shortUserName = `P${this.seIntersectionOrAntipodePoint.visiblePointCount}`;
      }
      this.seIntersectionOrAntipodePoint.pointVisibleBefore = false;
    }
    this.seIntersectionOrAntipodePoint.markKidsOutOfDate();
    this.seIntersectionOrAntipodePoint.update();
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
    if (this.userCreatedValue) {
      if (
        this.seIntersectionOrAntipodePoint.label &&
        this.useVisiblePointCountToRename
      ) {
        this.seIntersectionOrAntipodePoint.decrementVisiblePointCount();
        this.seIntersectionOrAntipodePoint.label.ref.shortUserName = `P${this.seIntersectionOrAntipodePoint.visiblePointCount}`;
      }
      this.seIntersectionOrAntipodePoint.pointVisibleBefore = false;
    } else {
      // Set the label to display the name of the point in visible count order
      this.seIntersectionOrAntipodePoint.pointVisibleBefore = true;
      if (
        this.seIntersectionOrAntipodePoint.label &&
        this.useVisiblePointCountToRename
      ) {
        this.seIntersectionOrAntipodePoint.incrementVisiblePointCount();
        this.seIntersectionOrAntipodePoint.label.ref.shortUserName = `P${this.seIntersectionOrAntipodePoint.visiblePointCount}`;
      }
    }
    if (
      this.seIntersectionOrAntipodePoint.label &&
      SETTINGS.point.showLabelsOfNonFreePointsInitially
    ) {
      this.seIntersectionOrAntipodePoint.label.showing = !this.userCreatedValue;
    }
    // hide the point
    this.seIntersectionOrAntipodePoint.showing = !this.userCreatedValue;
    // revert to temporary status
    this.seIntersectionOrAntipodePoint.ref.stylize(
      DisplayStyle.ApplyTemporaryVariables
    );
    // set back to automatically created
    this.seIntersectionOrAntipodePoint.isUserCreated = !this.userCreatedValue;
    this.seIntersectionOrAntipodePoint.markKidsOutOfDate();
    this.seIntersectionOrAntipodePoint.update();
    EventBus.fire("update-points-user-created", {});
  }

  toSVG(deletedNoduleIds: Array<number>): null | toSVGType[]{
    // First check to make sure that the object is not deleted, is showing, and exists (otherwise return null)
    //

    return null
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
