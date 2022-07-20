import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SavedNames } from "@/types";
import { SENodule } from "@/models/SENodule";

export class SetPointInitialVisibilityAndLabel extends Command {
  private sePoint: SEPoint;
  private toVisibleBoolean: boolean;

  constructor(sePoint: SEPoint, toVisibleBoolean: boolean) {
    super();
    this.sePoint = sePoint;
    this.toVisibleBoolean = toVisibleBoolean;
  }

  do(): void {
    this.sePoint.pointVisibleBefore = this.toVisibleBoolean;
    if (this.toVisibleBoolean) {
      if (this.sePoint.label) {
        // only execute this if toVisibleBoolean is true -- we are making a point visible for the first time
        this.sePoint.label.ref.shortUserName = `P${this.sePoint.nextVisiblePointCount}`;
      }
    } else {
      this.sePoint.decrementVisiblePointCount();
    }
  }

  saveState(): void {
    this.lastState = this.sePoint.id;
  }

  restoreState(): void {
    if (!this.toVisibleBoolean) {
      if (this.sePoint.label) {
        // only execute this if toVisibleBoolean is true -- we are making a point visible for the first time
        this.sePoint.label.ref.shortUserName = `P${this.sePoint.nextVisiblePointCount}`;
      }
    } else {
      this.sePoint.decrementVisiblePointCount();
    }
    this.sePoint.pointVisibleBefore = !this.toVisibleBoolean;
  }

  toOpcode(): null | string | Array<string> {
    return [
      "SetPointVisibility",
      // Any attribute that could possibly have a "= or "&" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.sePoint.name),
      // Object specific attributes
      "pointVisibleBefore=" + this.toVisibleBoolean
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
    //get the point from the object map
    // get the object specific attributes
    const sePoint = objMap.get(propMap.get("objectName") ?? "") as
      | SEPoint
      | undefined;

    const toVisibleBoolean = propMap.get("pointVisibleBefore") === "true";

    if (sePoint) {
      return new SetPointInitialVisibilityAndLabel(sePoint, toVisibleBoolean);
    }
    throw new Error(
      `Convert Point To Visible Command: SEpoint ${sePoint} doesn't exist`
    );
  }
}
