import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { Vector3 } from "three";
import { SavedNames } from "@/types";
import { SENodule } from "@/models/SENodule";
import { StyleEditPanels } from "@/types/Styles";

//#region addPointCommand
export class AddPointCommand extends Command {
  private sePoint: SEPoint;
  private seLabel: SELabel;
  private useVisiblePointCountToRename: boolean;
  constructor(
    sePoint: SEPoint,
    seLabel: SELabel,
    useVisiblePointCountToRename?: boolean
  ) {
    super();
    this.sePoint = sePoint;
    this.seLabel = seLabel;
    if (useVisiblePointCountToRename !== undefined) {
      this.useVisiblePointCountToRename = useVisiblePointCountToRename;
    } else {
      this.useVisiblePointCountToRename = true;
    }
  }

  do(): void {
    Command.store.addLabel(this.seLabel);
    this.sePoint.registerChild(this.seLabel);
    Command.store.addPoint(this.sePoint);
    // Set the label to display the name of the point in visible count order
    this.sePoint.pointVisibleBefore = true;
    this.sePoint.incrementVisiblePointCount();
    if (this.sePoint.label && this.useVisiblePointCountToRename) {
      this.sePoint.label.ref.shortUserName = `P${this.sePoint.visiblePointCount}`;
    }
  }

  saveState(): void {
    this.lastState = this.sePoint.id;
  }

  restoreState(): void {
    this.sePoint.decrementVisiblePointCount();
    if (this.sePoint.label && this.useVisiblePointCountToRename) {
      this.sePoint.label.ref.shortUserName = `P${this.sePoint.visiblePointCount}`;
    }
    this.sePoint.pointVisibleBefore = false;
    Command.store.removeLabel(this.seLabel.id);
    this.sePoint.unregisterChild(this.seLabel);
    Command.store.removePoint(this.lastState);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddPoint",
      // Any attribute that could possibly have a "= or "&" should be run through Command.symbolToASCIIDec
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
      "labelVector=" + this.seLabel.ref._locationVector.toFixed(9),
      "labelShowing=" + this.seLabel.showing,
      "labelExists=" + this.seLabel.exists,
      // Object specific attributes
      "pointVector=" + this.sePoint.locationVector.toFixed(9)
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
    //make the point
    const sePointLocation = new Vector3();
    sePointLocation.from(propMap.get("pointVector")); // convert to vector
    const pointFrontStyleString = propMap.get("objectFrontStyle");
    const pointBackStyleString = propMap.get("objectBackStyle");
    const sePoint = new SEPoint();
    sePoint.locationVector.copy(sePointLocation);
    // console.debug(`Point front style string ${pointFrontStyleString}`);
    if (pointFrontStyleString !== undefined) {
      sePoint.updatePlottableStyle(
        StyleEditPanels.Front,
        JSON.parse(pointFrontStyleString)
      );
    }
    // console.debug(`Point back style string ${pointBackStyleString}`);
    if (pointBackStyleString !== undefined) {
      sePoint.updatePlottableStyle(
        StyleEditPanels.Back,
        JSON.parse(pointBackStyleString)
      );
    }

    //make the label
    const seLabel = new SELabel("point", sePoint);
    const seLabelLocation = new Vector3();
    seLabelLocation.from(propMap.get("labelVector")); // convert to Number
    seLabel.locationVector.copy(seLabelLocation);
    const labelStyleString = propMap.get("labelStyle");
    // console.debug(`Point label style string ${labelStyleString}`);
    if (labelStyleString !== undefined) {
      seLabel.updatePlottableStyle(
        StyleEditPanels.Label,
        JSON.parse(labelStyleString)
      );
    }

    //put the point in the object map
    if (propMap.get("objectName") !== undefined) {
      // console.debug(
      //   `old name ${sePoint.name}, new name ${propMap.get("objectName")}`
      // );
      sePoint.name = propMap.get("objectName") ?? "";
      sePoint.showing = propMap.get("objectShowing") === "true";
      sePoint.exists = propMap.get("objectExists") === "true";
      objMap.set(sePoint.name, sePoint);
    } else {
      throw new Error("AddPoint: Point Name doesn't exist");
    }

    //put the label in the object map
    if (propMap.get("labelName") !== undefined) {
      seLabel.name = propMap.get("labelName") ?? "";
      seLabel.showing = propMap.get("labelShowing") === "true";
      seLabel.exists = propMap.get("labelExists") === "true";
      objMap.set(seLabel.name, seLabel);
    } else {
      throw new Error("AddPoint: Label Name doesn't exist");
    }
    return new AddPointCommand(
      sePoint,
      seLabel,
      false //The name of this point is set by the saved value and not the visible count
    );
  }
}
//#endregion addPointCommand
