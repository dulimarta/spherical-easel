import { Command } from "./Command";
import { SavedNames } from "@/types";
import { SELabel } from "@/models/SELabel";
import SETTINGS from "@/global-settings";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import { SEParametricEndPoint } from "@/models/SEParametricEndPoint";
import { SEParametricTracePoint } from "@/models/SEParametricTracePoint";
import { SEParametric } from "@/models/SEParametric";
import { StyleCategory } from "@/types/Styles";
import { toSVGReturnType } from "@/types";

export class AddParametricEndPointsCommand extends Command {
  private seStartEndPoint: SEParametricEndPoint;
  private seEndEndPoint: SEParametricEndPoint;
  private seTracePoint: SEParametricTracePoint;
  private parametricParent: SEParametric;
  private seStartLabel: SELabel;
  private seEndLabel: SELabel;
  private seTraceLabel: SELabel;
  private useVisiblePointCountToRename: boolean;
  constructor(
    parametricParent: SEParametric,
    startEndPoint: SEParametricEndPoint,
    startLabel: SELabel,
    endEndPoint: SEParametricEndPoint,
    endLabel: SELabel,
    tracePoint: SEParametricTracePoint,
    traceLabel: SELabel,
    useVisiblePointCountToRename?: boolean
  ) {
    super();
    this.seStartEndPoint = startEndPoint;
    this.seEndEndPoint = endEndPoint;
    this.parametricParent = parametricParent;
    this.seStartLabel = startLabel;
    this.seEndLabel = endLabel;
    this.seTracePoint = tracePoint;
    this.seTraceLabel = traceLabel;
    if (useVisiblePointCountToRename !== undefined) {
      this.useVisiblePointCountToRename = useVisiblePointCountToRename;
    } else {
      this.useVisiblePointCountToRename = true;
    }
  }

  do(): void {
    this.parametricParent.registerChild(this.seStartEndPoint);
    this.parametricParent.registerChild(this.seEndEndPoint);
    this.parametricParent.registerChild(this.seTracePoint);
    this.seStartEndPoint.registerChild(this.seStartLabel);
    this.seEndEndPoint.registerChild(this.seEndLabel);
    this.seTracePoint.registerChild(this.seTraceLabel);
    if (SETTINGS.point.showLabelsOfParametricEndPointsInitially) {
      this.seStartLabel.showing = true;
      this.seEndLabel.showing = true;
      this.seTraceLabel.showing = true;
    } else {
      this.seStartLabel.showing = false;
      this.seEndLabel.showing = false;
      this.seTraceLabel.showing = false;
    }
    Command.store.addPoint(this.seStartEndPoint);
    Command.store.addPoint(this.seEndEndPoint);
    Command.store.addPoint(this.seTracePoint);
    Command.store.addLabel(this.seStartLabel);
    Command.store.addLabel(this.seEndLabel);
    Command.store.addLabel(this.seTraceLabel);
    // Set the label to display the name of the points in visible count order
    this.seStartEndPoint.pointVisibleBefore = true;
    this.seStartEndPoint.incrementVisiblePointCount();
    if (this.seStartEndPoint.label && this.useVisiblePointCountToRename) {
      this.seStartEndPoint.label.ref.shortUserName = `P${this.seStartEndPoint.visiblePointCount}`;
    }

    this.seTracePoint.pointVisibleBefore = true;
    this.seTracePoint.incrementVisiblePointCount();
    if (this.seTracePoint.label && this.useVisiblePointCountToRename) {
      this.seTracePoint.label.ref.shortUserName = `P${this.seTracePoint.visiblePointCount}`;
    }

    this.seEndEndPoint.pointVisibleBefore = true;
    this.seEndEndPoint.incrementVisiblePointCount();
    if (this.seEndEndPoint.label && this.useVisiblePointCountToRename) {
      this.seEndEndPoint.label.ref.shortUserName = `P${this.seEndEndPoint.visiblePointCount}`;
    }

    // this.seStartEndPoint.markKidsOutOfDate();
    // this.seStartEndPoint.update();
    // this.seEndEndPoint.markKidsOutOfDate();
    // this.seEndEndPoint.update();
    // this.seTracePoint.markKidsOutOfDate();
    // this.seTracePoint.update();
  }

  saveState(): void {
    this.lastState = this.seStartEndPoint.id;
  }

  restoreState(): void {
    this.seStartEndPoint.decrementVisiblePointCount();
    if (this.seStartEndPoint.label && this.useVisiblePointCountToRename) {
      this.seStartEndPoint.label.ref.shortUserName = `P${this.seStartEndPoint.visiblePointCount}`;
    }
    this.seStartEndPoint.pointVisibleBefore = false;

    this.seTracePoint.decrementVisiblePointCount();
    if (this.seTracePoint.label && this.useVisiblePointCountToRename) {
      this.seTracePoint.label.ref.shortUserName = `P${this.seTracePoint.visiblePointCount}`;
    }
    this.seTracePoint.pointVisibleBefore = false;

    this.seEndEndPoint.decrementVisiblePointCount();
    if (this.seEndEndPoint.label && this.useVisiblePointCountToRename) {
      this.seEndEndPoint.label.ref.shortUserName = `P${this.seEndEndPoint.visiblePointCount}`;
    }
    this.seEndEndPoint.pointVisibleBefore = false;

    Command.store.removeLabel(this.seEndLabel.id);
    Command.store.removeLabel(this.seStartLabel.id);
    Command.store.removeLabel(this.seTraceLabel.id);
    Command.store.removePoint(this.seEndEndPoint.id);
    Command.store.removePoint(this.seStartEndPoint.id);
    Command.store.removePoint(this.seTracePoint.id);
    this.seEndEndPoint.unregisterChild(this.seEndLabel);
    this.seStartEndPoint.unregisterChild(this.seStartLabel);
    this.seTracePoint.unregisterChild(this.seTraceLabel);
    this.parametricParent.unregisterChild(this.seEndEndPoint);
    this.parametricParent.unregisterChild(this.seStartEndPoint);
    this.parametricParent.unregisterChild(this.seTracePoint);
  }

  toSVG(deletedNoduleIds: Array<number>): null | toSVGReturnType[]{
    // First check to make sure that the object is not deleted, is showing, and exists (otherwise return null)
    //

    return null
  }

  toOpcode(): null | string | Array<string> {
    // console.log(
    //   "Command.symbolToASCIIDec(this.seStartEndPoint.name)",
    //   Command.symbolToASCIIDec(this.seStartEndPoint.name)
    // );

    // SEParametric generates its sample points in its neutral (unrotated) pose.
    // Therefore, all its dependents must also be stored in their neutral pose.
    const rotationMatrix = Command.store.inverseTotalRotationMatrix;

    const neutralTracePointLocation =
      this.parametricParent.tracePoint.locationVector
        .clone()
        .applyMatrix4(rotationMatrix);
    const neutralTracePointLabelLocation = this.parametricParent.tracePoint
      .label!.locationVector.clone()
      .applyMatrix4(rotationMatrix);
    const [minPoint, maxPoint] = this.parametricParent.endPoints;
    const neutralMinPointLocation = minPoint.locationVector
      .clone()
      .applyMatrix4(rotationMatrix);
    console.debug("Saved min point at", neutralMinPointLocation.toFixed(4));
    const neutralMinLabelLocation = minPoint
      .label!.locationVector.clone()
      .applyMatrix4(rotationMatrix);
    const neutralMaxPointLocation = maxPoint.locationVector
      .clone()
      .applyMatrix4(rotationMatrix);
    console.debug("Saved max point at", neutralMaxPointLocation.toFixed(4));
    const neutralMaxLabelLocation = maxPoint
      .label!.locationVector.clone()
      .applyMatrix4(rotationMatrix);

    return [
      "AddParametricEndPoints",
      //Parent Info
      "parametricEndPointParametricParentName=" +
        Command.symbolToASCIIDec(this.parametricParent.name),

      //StartEndPoint Info
      "parametricEndPointseStartEndPointName=" +
        Command.symbolToASCIIDec(this.seStartEndPoint.name),
      "parametricEndPointseStartEndPointLocationVector=" +
        neutralMinPointLocation.toFixed(7),
      "parametricEndPointseStartEndPointShowing=" +
        this.seStartEndPoint.showing,
      "parametricEndPointseStartEndPointExists=" + this.seStartEndPoint.exists,
      "parametricEndPointseStartEndPointFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seStartEndPoint.ref.currentStyleState(StyleCategory.Front)
          )
        ),
      "parametricEndPointseStartEndPointBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seStartEndPoint.ref.currentStyleState(StyleCategory.Back)
          )
        ),

      //EndEndPoint Info
      "parametricEndPointseEndEndPointName=" +
        Command.symbolToASCIIDec(this.seEndEndPoint.name),
      "parametricEndPointseEndEndPointLocationVector=" +
        neutralMaxPointLocation.toFixed(7),
      "parametricEndPointseEndEndPointShowing=" + this.seEndEndPoint.showing,
      "parametricEndPointseEndEndPointExists=" + this.seEndEndPoint.exists,
      "parametricEndPointseEndEndPointFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seEndEndPoint.ref.currentStyleState(StyleCategory.Front)
          )
        ),
      "parametricEndPointseEndEndPointBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seEndEndPoint.ref.currentStyleState(StyleCategory.Back)
          )
        ),

      //TracePoint Info
      "parametricEndPointseTracePointName=" +
        Command.symbolToASCIIDec(this.seTracePoint.name),
      "parametricEndPointseTracePointLocationVector=" +
        neutralTracePointLocation.toFixed(7),
      "parametricEndPointseTracePointShowing=" + this.seTracePoint.showing,
      "parametricEndPointseTracePointExists=" + this.seTracePoint.exists,
      "parametricEndPointseTracePointFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seTracePoint.ref.currentStyleState(StyleCategory.Front)
          )
        ),
      "parametricEndPointseTracePointBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seTracePoint.ref.currentStyleState(StyleCategory.Back)
          )
        ),

      //Start End Point Label Info
      "parametricEndPointseStartLabelName=" +
        Command.symbolToASCIIDec(this.seStartLabel.name),
      "parametricEndPointseStartLabelLocationVector=" +
        neutralMinLabelLocation.toFixed(7),
      "parametricEndPointseStartLabelShowing=" + this.seStartLabel.showing,
      "parametricEndPointseStartLabelExists=" + this.seStartLabel.exists,
      "parametricEndPointseStartLabelLabelStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seStartLabel.ref.currentStyleState(StyleCategory.Label)
          )
        ),

      //End End Point Label Info
      "parametricEndPointseEndLabelName=" +
        Command.symbolToASCIIDec(this.seEndLabel.name),
      "parametricEndPointseEndLabelLocationVector=" +
        neutralMaxLabelLocation.toFixed(7),
      "parametricEndPointseEndLabelShowing=" + this.seEndLabel.showing,
      "parametricEndPointseEndLabelExists=" + this.seEndLabel.exists,
      "parametricEndPointseEndLabelLabelStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seEndLabel.ref.currentStyleState(StyleCategory.Label)
          )
        ),

      //Trace Point Label Info
      "parametricEndPointseTraceLabelName=" +
        Command.symbolToASCIIDec(this.seTraceLabel.name),
      "parametricEndPointseTraceLabelLocationVector=" +
        neutralTracePointLabelLocation.toFixed(7),
      "parametricEndPointseTraceLabelShowing=" + this.seTraceLabel.showing,
      "parametricEndPointseTraceLabelExists=" + this.seTraceLabel.exists,
      "parametricEndPointseTraceLabelLabelStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seTraceLabel.ref.currentStyleState(StyleCategory.Label)
          )
        )
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
    const parametricParent = objMap.get(
      propMap.get("parametricEndPointParametricParentName") ?? ""
    ) as SEParametric | undefined;

    if (parametricParent !== undefined) {
      // make the Start End Point
      const seStartEndPoint = new SEParametricEndPoint(
        // startEndPoint,
        parametricParent,
        "min"
      );
      const seStartEndPointLocation = new Vector3();
      seStartEndPointLocation.from(
        propMap.get("parametricEndPointseStartEndPointLocationVector")
      ); // convert to vector
      console.debug("Loaded min point at", seStartEndPointLocation.toFixed(4));

      seStartEndPoint.locationVector.copy(seStartEndPointLocation);
      let pointFrontStyleString = propMap.get(
        "parametricEndPointseStartEndPointFrontStyle"
      );
      if (pointFrontStyleString !== undefined)
        seStartEndPoint.updatePlottableStyle(
          StyleCategory.Front,
          JSON.parse(pointFrontStyleString)
        );
      let pointBackStyleString = propMap.get(
        "parametricEndPointseStartEndPointBackStyle"
      );
      if (pointBackStyleString !== undefined)
        seStartEndPoint.updatePlottableStyle(
          StyleCategory.Back,
          JSON.parse(pointBackStyleString)
        );

      // make the Start End Point Label
      const seStartEndPointLabel = new SELabel("point", seStartEndPoint);
      const seStartEndPointLabelLocation = new Vector3();
      seStartEndPointLabelLocation.from(
        propMap.get("parametricEndPointseStartLabelLocationVector")
      ); // convert to vector
      seStartEndPointLabel.locationVector.copy(seStartEndPointLabelLocation);
      let labelStyleString = propMap.get(
        "parametricEndPointseStartLabelLabelStyle"
      );
      if (labelStyleString !== undefined) {
        seStartEndPointLabel.updatePlottableStyle(
          StyleCategory.Label,
          JSON.parse(labelStyleString)
        );
      }

      //put the Start End Point in the object map
      if (propMap.get("parametricEndPointseStartEndPointName") !== undefined) {
        seStartEndPoint.name =
          propMap.get("parametricEndPointseStartEndPointName") ?? "";
        seStartEndPoint.showing =
          propMap.get("parametricEndPointseStartEndPointShowing") === "true";
        seStartEndPoint.exists =
          propMap.get("parametricEndPointseStartEndPointExists") === "true";
        objMap.set(seStartEndPoint.name, seStartEndPoint);
      } else {
        throw new Error(
          `AddParametricEndPoint: Start End Point Name doesn't exist ${propMap.get(
            "parametricEndPointseStartEndPointName"
          )}`
        );
      }

      //put the Start End Point label in the object map
      if (propMap.get("parametricEndPointseStartLabelName") !== undefined) {
        seStartEndPointLabel.name =
          propMap.get("parametricEndPointseStartLabelName") ?? "";
        seStartEndPointLabel.showing =
          propMap.get("parametricEndPointseStartLabelShowing") === "true";
        seStartEndPointLabel.exists =
          propMap.get("parametricEndPointseStartLabelExists") === "true";
        objMap.set(seStartEndPointLabel.name, seStartEndPointLabel);
      } else {
        throw new Error(
          "AddParametricEndPoint: Start End Point Label Name doesn't exist"
        );
      }
      seStartEndPoint.ref.updateDisplay();

      // make the End End Point
      const seEndEndPoint = new SEParametricEndPoint(parametricParent, "max");
      const seEndEndPointLocation = new Vector3();
      seEndEndPointLocation.from(
        propMap.get("parametricEndPointseEndEndPointLocationVector")
      ); // convert to vector
      console.debug("Loaded max point at", seEndEndPointLocation.toFixed(4));
      seEndEndPoint.locationVector.copy(seEndEndPointLocation);
      pointFrontStyleString = propMap.get(
        "parametricEndPointseEndEndPointFrontStyle"
      );
      if (pointFrontStyleString !== undefined)
        seEndEndPoint.updatePlottableStyle(
          StyleCategory.Front,
          JSON.parse(pointFrontStyleString)
        );
      pointBackStyleString = propMap.get(
        "parametricEndPointseEndEndPointBackStyle"
      );
      if (pointBackStyleString !== undefined)
        seEndEndPoint.updatePlottableStyle(
          StyleCategory.Back,
          JSON.parse(pointBackStyleString)
        );

      // make the End End Point Label
      const seEndEndPointLabel = new SELabel("point", seEndEndPoint);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(
        propMap.get("parametricEndPointseEndLabelLocationVector")
      ); // convert to vector
      seEndEndPointLabel.locationVector.copy(seLabelLocation);
      labelStyleString = propMap.get("parametricEndPointseEndLabelLabelStyle");
      if (labelStyleString !== undefined) {
        seEndEndPointLabel.updatePlottableStyle(
          StyleCategory.Label,
          JSON.parse(labelStyleString)
        );
      }

      //put the End End Point in the object map
      if (propMap.get("parametricEndPointseEndEndPointName") !== undefined) {
        seEndEndPoint.name =
          propMap.get("parametricEndPointseEndEndPointName") ?? "";
        seEndEndPoint.showing =
          propMap.get("parametricEndPointseEndEndPointShowing") === "true";
        seEndEndPoint.exists =
          propMap.get("parametricEndPointseEndEndPointExists") === "true";
        objMap.set(seEndEndPoint.name, seEndEndPoint);
      } else {
        throw new Error(
          "AddParametricEndPoint: End End Point Name doesn't exist"
        );
      }

      //put the End End Point label in the object map
      if (propMap.get("parametricEndPointseEndLabelName") !== undefined) {
        seEndEndPointLabel.name =
          propMap.get("parametricEndPointseEndLabelName") ?? "";
        seEndEndPointLabel.showing =
          propMap.get("parametricEndPointseEndLabelShowing") === "true";
        seEndEndPointLabel.exists =
          propMap.get("parametricEndPointseEndLabelExists") === "true";
        objMap.set(seEndEndPointLabel.name, seEndEndPointLabel);
      } else {
        throw new Error(
          "AddParametricEndPoint: End End Point Label Name doesn't exist"
        );
      }

      seEndEndPoint.ref.updateDisplay();
      // make the Trace Point
      const seTracePoint = new SEParametricTracePoint(parametricParent);
      const seTracePointLocation = new Vector3();
      seTracePointLocation.from(
        propMap.get("parametricEndPointseTracePointLocationVector")
      ); // convert to vector
      seTracePoint.locationVector.copy(seTracePointLocation);
      pointFrontStyleString = propMap.get(
        "parametricEndPointseTracePointFrontStyle"
      );
      if (pointFrontStyleString !== undefined)
        seTracePoint.updatePlottableStyle(
          StyleCategory.Front,
          JSON.parse(pointFrontStyleString)
        );
      pointBackStyleString = propMap.get(
        "parametricEndPointseTracePointBackStyle"
      );
      if (pointBackStyleString !== undefined)
        seTracePoint.updatePlottableStyle(
          StyleCategory.Back,
          JSON.parse(pointBackStyleString)
        );

      // make the Trace Point Label
      const seTracePointLabel = new SELabel("point", seTracePoint);
      const seTracePointLabelLocation = new Vector3();
      seLabelLocation.from(
        propMap.get("parametricEndPointseTraceLabelLocationVector")
      ); // convert to vector
      seTracePointLabel.locationVector.copy(seTracePointLabelLocation);
      labelStyleString = propMap.get(
        "parametricEndPointseTraceLabelLabelStyle"
      );
      if (labelStyleString !== undefined) {
        seTracePointLabel.updatePlottableStyle(
          StyleCategory.Label,
          JSON.parse(labelStyleString)
        );
      }

      //put the Trace Point in the object map
      if (propMap.get("parametricEndPointseTracePointName") !== undefined) {
        seTracePoint.name =
          propMap.get("parametricEndPointseTracePointName") ?? "";
        seTracePoint.showing =
          propMap.get("parametricEndPointseTracePointShowing") === "true";
        seTracePoint.exists =
          propMap.get("parametricEndPointseTracePointExists") === "true";
        objMap.set(seTracePoint.name, seTracePoint);
      } else {
        throw new Error(
          "AddParametricEndPoint: Trace Point Name doesn't exist"
        );
      }

      //put the Trace Point label in the object map
      if (propMap.get("parametricEndPointseTraceLabelName") !== undefined) {
        seTracePointLabel.name =
          propMap.get("parametricEndPointseTraceLabelName") ?? "";
        seTracePointLabel.showing =
          propMap.get("parametricEndPointseTraceLabelShowing") === "true";
        seTracePointLabel.exists =
          propMap.get("parametricEndPointseTraceLabelExists") === "true";
        objMap.set(seTracePointLabel.name, seTracePointLabel);
      } else {
        throw new Error(
          "AddParametricEndPoint: Trace Point Label Name doesn't exist"
        );
      }

      return new AddParametricEndPointsCommand(
        parametricParent,
        seStartEndPoint,
        seStartEndPointLabel,
        seEndEndPoint,
        seEndEndPointLabel,
        seTracePoint,
        seTracePointLabel,
        false //The name of these points are set by the saved value and not the visible count
      );
    } else {
      throw new Error(
        `AddParametricEndPoints: parametric parent ${parametricParent} is undefined`
      );
    }
  }
}
