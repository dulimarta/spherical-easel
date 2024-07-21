import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { SETranslation } from "@/models/SETranslation";
import { SESegment } from "@/models/SESegment";
import { SavedNames } from "@/types";
import { AddTranslationCommand } from "./AddTranslationCommand";
import { SERotation } from "@/models/SERotation";
import { SEPoint } from "@/models/SEPoint";
import { SEExpression } from "@/models/SEExpression";
import { SEEllipse } from "@/models/SEEllipse";
import { toSVGType } from "@/types";

export class AddRotationCommand extends Command {
  private seRotation: SERotation;
  private sePointOfRotation: SEPoint;
  private seAngleExpression: SEExpression;

  constructor(
    seRotation: SERotation,
    pointOfRotation: SEPoint,
    angle: SEExpression
  ) {
    super();
    this.seRotation = seRotation;
    this.sePointOfRotation = pointOfRotation;
    this.seAngleExpression = angle;
  }
  do(): void {
    Command.store.addTransformation(this.seRotation);
    this.sePointOfRotation.registerChild(this.seRotation);
    this.seAngleExpression.registerChild(this.seRotation);
  }

  saveState(): void {
    this.lastState = this.seRotation.id;
  }

  restoreState(): void {
    this.seAngleExpression.unregisterChild(this.seRotation);
    this.sePointOfRotation.unregisterChild(this.seRotation);
    Command.store.removeTransformation(this.lastState);
  }

  toSVG(deletedNoduleIds: Array<number>): null | toSVGType[]{
    // First check to make sure that the object is not deleted, is showing, and exists (otherwise return null)
    //

    return null
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddRotation",
      // Any attribute that could possibly have a "=", "@", "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seRotation.name),
      "objectExists=" + this.seRotation.exists,
      // "objectShowing=" + this.seTranslation.showing, // this object is always showing so showing has no effect

      // Object specific attributes
      "rotationPointName=" +
        Command.symbolToASCIIDec(this.sePointOfRotation.name),
      "rotationAngleExpressionName=" +
        Command.symbolToASCIIDec(this.seAngleExpression.name)
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

    // get the object specific attributes
    const rotationPoint = objMap.get(propMap.get("rotationPointName") ?? "") as
      | SEPoint
      | undefined;
    const angleExpression = objMap.get(
      propMap.get("rotationAngleExpressionName") ?? ""
    ) as SEExpression | undefined;

    if (rotationPoint && angleExpression) {
      const rotation = new SERotation(rotationPoint, angleExpression);

      //put the rotation in the object map
      if (propMap.get("objectName") !== undefined) {
        rotation.name = propMap.get("objectName") ?? "";
        // rotation.showing = propMap.get("objectShowing") === "true";
        rotation.exists = propMap.get("objectExists") === "true";
        objMap.set(rotation.name, rotation);
      } else {
        throw new Error("AddRotationCommand: Rotation name doesn't exist");
      }
      return new AddRotationCommand(rotation, rotationPoint, angleExpression);
    }
    throw new Error(
      `AddRotationCommand: ${rotationPoint} or ${angleExpression} is undefined`
    );
  }
}
