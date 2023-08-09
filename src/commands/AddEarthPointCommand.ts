import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { Vector3 } from "three";
import { SavedNames } from "@/types";
import { SENodule } from "@/models/SENodule";
import { StyleEditPanels } from "@/types/Styles";
import { SEEarthPoint } from "@/models/SEEarthPoint";

export class AddEarthPointCommand extends Command {
  private seEarthPoint: SEEarthPoint;
  private seLabel: SELabel;
  private useVisiblePointCountToRename: boolean;
  private latitude: number;
  private longitude: number;
  constructor(
    seEarthPoint: SEEarthPoint,
    seLabel: SELabel,
    useVisiblePointCountToRename?: boolean
  ) {
    super();
    this.seEarthPoint = seEarthPoint;
    this.latitude = this.seEarthPoint.latitude;
    this.longitude = this.seEarthPoint.longitude;
    this.seLabel = seLabel;
    if (useVisiblePointCountToRename !== undefined) {
      this.useVisiblePointCountToRename = useVisiblePointCountToRename;
    } else {
      this.useVisiblePointCountToRename = true;
    }
  }

  do(): void {
    Command.store.addLabel(this.seLabel);
    this.seEarthPoint.registerChild(this.seLabel);
    Command.store.addPoint(this.seEarthPoint);
    // Set the label to display the name of the point in visible count order
    this.seEarthPoint.pointVisibleBefore = true;
    this.seEarthPoint.incrementVisiblePointCount();
    if (this.seEarthPoint.label && this.useVisiblePointCountToRename) {
      this.seEarthPoint.label.ref.shortUserName = `P${this.seEarthPoint.visiblePointCount}`;
    }
  }

  saveState(): void {
    this.lastState = this.seEarthPoint.id;
  }

  restoreState(): void {
    this.seEarthPoint.decrementVisiblePointCount();
    if (this.seEarthPoint.label && this.useVisiblePointCountToRename) {
      this.seEarthPoint.label.ref.shortUserName = `P${this.seEarthPoint.visiblePointCount}`;
    }
    this.seEarthPoint.pointVisibleBefore = false;
    Command.store.removeLabel(this.seLabel.id);
    this.seEarthPoint.unregisterChild(this.seLabel);
    Command.store.removePoint(this.lastState);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddEarthPoint",
      // Any attribute that could possibly have a "= or "&" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seEarthPoint.name),
      "objectExists=" + this.seEarthPoint.exists,
      "objectShowing=" + this.seEarthPoint.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seEarthPoint.ref.currentStyleState(StyleEditPanels.Front)
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seEarthPoint.ref.currentStyleState(StyleEditPanels.Back)
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
      "pointVector=" + this.seEarthPoint.locationVector.toFixed(9),
      "earthLatitude=" + this.seEarthPoint.latitude.toFixed(9),
      "earthLongitude=" + this.seEarthPoint.longitude.toFixed(9)
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
    const seEarthPointLocation = new Vector3();
    seEarthPointLocation.from(propMap.get("pointVector")); // convert to vector
    const pointFrontStyleString = propMap.get("objectFrontStyle");
    const pointBackStyleString = propMap.get("objectBackStyle");
    const latitude = Number(propMap.get("earthLatitude"));
    const longitude = Number(propMap.get("earthLongitude"));
    if (latitude !== undefined && longitude !== undefined) {
      const seEarthPoint = new SEEarthPoint(longitude, latitude);
      seEarthPoint.locationVector.copy(seEarthPointLocation);
      // console.debug(`Point front style string ${pointFrontStyleString}`);
      if (pointFrontStyleString !== undefined) {
        seEarthPoint.updatePlottableStyle(
          StyleEditPanels.Front,
          JSON.parse(pointFrontStyleString)
        );
      }
      // console.debug(`Point back style string ${pointBackStyleString}`);
      if (pointBackStyleString !== undefined) {
        seEarthPoint.updatePlottableStyle(
          StyleEditPanels.Back,
          JSON.parse(pointBackStyleString)
        );
      }

      //make the label
      const seLabel = new SELabel("point", seEarthPoint);
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
        //   `old name ${seEarthPoint.name}, new name ${propMap.get("objectName")}`
        // );
        seEarthPoint.name = propMap.get("objectName") ?? "";
        seEarthPoint.showing = propMap.get("objectShowing") === "true";
        seEarthPoint.exists = propMap.get("objectExists") === "true";
        objMap.set(seEarthPoint.name, seEarthPoint);
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
      return new AddEarthPointCommand(
        seEarthPoint,
        seLabel,
        false //The name of this point is set by the saved value and not the visible count
      );
    } else {
      throw new Error("Earth Point Latitude or Longitude undefined");
    }
  }
}
