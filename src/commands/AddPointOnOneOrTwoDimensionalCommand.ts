import { Command } from "./Command";
import { SavedNames, SEOneOrTwoDimensional } from "@/types";
import { SELabel } from "@/models/SELabel";
import SETTINGS from "@/global-settings";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import { SEPointOnOneOrTwoDimensional } from "@/models/SEPointOnOneOrTwoDimensional";
import { StyleEditPanels } from "@/types/Styles";

export class AddPointOnOneDimensionalCommand extends Command {
  private sePointOnOneOrTwoDimensional: SEPointOnOneOrTwoDimensional;
  private parent: SEOneOrTwoDimensional;
  private seLabel: SELabel;
  private useVisiblePointCountToRename: boolean;
  constructor(
    sePointOnOneDimensional: SEPointOnOneOrTwoDimensional,
    parent: SEOneOrTwoDimensional,
    seLabel: SELabel,
    useVisiblePointCountToRename?: boolean
  ) {
    super();
    this.sePointOnOneOrTwoDimensional = sePointOnOneDimensional;
    this.parent = parent;
    this.seLabel = seLabel;
    if (useVisiblePointCountToRename !== undefined) {
      this.useVisiblePointCountToRename = useVisiblePointCountToRename;
    } else {
      this.useVisiblePointCountToRename = true;
    }
  }

  do(): void {
    this.parent.registerChild(this.sePointOnOneOrTwoDimensional);
    this.sePointOnOneOrTwoDimensional.registerChild(this.seLabel);
    if (SETTINGS.point.showLabelsOfPointOnObjectInitially) {
      this.seLabel.showing = true;
    } else {
      this.seLabel.showing = false;
    }
    Command.store.addPoint(this.sePointOnOneOrTwoDimensional);
    Command.store.addLabel(this.seLabel);
    // Set the label to display the name of the point in visible count order
    this.sePointOnOneOrTwoDimensional.pointVisibleBefore = true;
    if (
      this.sePointOnOneOrTwoDimensional.label &&
      this.useVisiblePointCountToRename
    ) {
      this.sePointOnOneOrTwoDimensional.incrementVisiblePointCount();
      this.sePointOnOneOrTwoDimensional.label.ref.shortUserName = `P${this.sePointOnOneOrTwoDimensional.visiblePointCount}`;
    }
    // this.sePointOnOneOrTwoDimensional.markKidsOutOfDate();
    // this.sePointOnOneOrTwoDimensional.update();
  }

  saveState(): void {
    this.lastState = this.sePointOnOneOrTwoDimensional.id;
  }

  restoreState(): void {
    if (
      this.sePointOnOneOrTwoDimensional.label &&
      this.useVisiblePointCountToRename
    ) {
      this.sePointOnOneOrTwoDimensional.decrementVisiblePointCount();
      this.sePointOnOneOrTwoDimensional.label.ref.shortUserName = `P${this.sePointOnOneOrTwoDimensional.visiblePointCount}`;
    }
    this.sePointOnOneOrTwoDimensional.pointVisibleBefore = false;
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removePoint(this.lastState);
    this.sePointOnOneOrTwoDimensional.unregisterChild(this.seLabel);
    this.parent.unregisterChild(this.sePointOnOneOrTwoDimensional);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddPointOnOneDimensional",
      // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" +
        Command.symbolToASCIIDec(this.sePointOnOneOrTwoDimensional.name),
      "objectExists=" + this.sePointOnOneOrTwoDimensional.exists,
      "objectShowing=" + this.sePointOnOneOrTwoDimensional.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.sePointOnOneOrTwoDimensional.ref.currentStyleState(
              StyleEditPanels.Front
            )
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.sePointOnOneOrTwoDimensional.ref.currentStyleState(
              StyleEditPanels.Back
            )
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
      "labelVector=" + this.seLabel.ref._locationVector.toFixed(9),
      "labelShowing=" + this.seLabel.showing,
      "labelExists=" + this.seLabel.exists,
      // Object specific attributes
      "pointOnOneOrTwoDimensionalParentName=" + this.parent.name,
      "pointOnOneOrTwoDimensionalVector=" +
        this.sePointOnOneOrTwoDimensional.locationVector.toFixed(9)
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
    const pointOnOneOrTwoDimensionalParent = objMap.get(
      propMap.get("pointOnOneOrTwoDimensionalParentName") ?? ""
    ) as SEOneOrTwoDimensional | undefined;

    const positionVector = new Vector3();
    positionVector.from(propMap.get("pointOnOneOrTwoDimensionalVector")); // convert to vector, if .from() fails the vector is set to 0,0,1
    // console.debug(
    //   `point on one or two dim vector ${positionVector.toFixed(2)}`
    // );
    if (pointOnOneOrTwoDimensionalParent && positionVector.z !== 1) {
      //make the point on object
      const sePointOnOneOrTwoDimensional = new SEPointOnOneOrTwoDimensional(
        pointOnOneOrTwoDimensionalParent
      );
      // use the direct setter because the parent may be out of date
      sePointOnOneOrTwoDimensional.pointDirectLocationSetter(positionVector);
      //style the point on object
      const pointOnOneOrTwoDimensionalFrontStyleString =
        propMap.get("objectFrontStyle");
      if (pointOnOneOrTwoDimensionalFrontStyleString !== undefined)
        sePointOnOneOrTwoDimensional.updatePlottableStyle(
          StyleEditPanels.Front,
          JSON.parse(pointOnOneOrTwoDimensionalFrontStyleString)
        );
      const pointOnOneOrTwoDimensionalBackStyleString =
        propMap.get("objectBackStyle");
      if (pointOnOneOrTwoDimensionalBackStyleString !== undefined)
        sePointOnOneOrTwoDimensional.updatePlottableStyle(
          StyleEditPanels.Back,
          JSON.parse(pointOnOneOrTwoDimensionalBackStyleString)
        );

      //make the label and set its location
      const seLabel = new SELabel("point", sePointOnOneOrTwoDimensional);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      seLabel.locationVector.copy(seLabelLocation);
      //style the label
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        seLabel.updatePlottableStyle(
          StyleEditPanels.Label,
          JSON.parse(labelStyleString)
        );

      //put the point on one or two dimensional in the object map
      if (propMap.get("objectName") !== undefined) {
        sePointOnOneOrTwoDimensional.name = propMap.get("objectName") ?? "";
        sePointOnOneOrTwoDimensional.showing =
          propMap.get("objectShowing") === "true";
        sePointOnOneOrTwoDimensional.exists =
          propMap.get("objectExists") === "true";
        objMap.set(
          sePointOnOneOrTwoDimensional.name,
          sePointOnOneOrTwoDimensional
        );
      } else {
        throw new Error(
          "AddPointOnOneOrTwoDimensionalCommand:  Point name doesn't exist"
        );
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        seLabel.name = propMap.get("labelName") ?? "";
        seLabel.showing = propMap.get("labelShowing") === "true";
        seLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(seLabel.name, seLabel);
      } else {
        throw new Error(
          "AddPointOnOneOrTwoDimensionalCommand: Label Name doesn't exist"
        );
      }
      return new AddPointOnOneDimensionalCommand(
        sePointOnOneOrTwoDimensional,
        pointOnOneOrTwoDimensionalParent,
        seLabel,
        false //The name of this point is set by the saved value and not the visible count
      );
    }
    throw new Error(
      `AddPointOnOneOrTwoDimensional: ${pointOnOneOrTwoDimensionalParent} or ${positionVector} is undefined`
    );
  }
}
