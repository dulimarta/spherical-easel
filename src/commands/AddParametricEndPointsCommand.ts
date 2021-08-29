import { Command } from "./Command";
import { SavedNames } from "@/types";
import { SELabel } from "@/models/SELabel";
import SETTINGS from "@/global-settings";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import Point from "@/plottables/Point";
import { DisplayStyle } from "@/plottables/Nodule";
import Label from "@/plottables/Label";
import { SEParametricEndPoint } from "@/models/SEParametricEndPoint";
import { SEParametricTracePoint } from "@/models/SEParametricTracePoint";
import { SEParametric } from "@/models/SEParametric";
import { StyleEditPanels } from "@/types/Styles";

export class AddParametricEndPointsCommand extends Command {
  private seStartEndPoint: SEParametricEndPoint;
  private seEndEndPoint: SEParametricEndPoint;
  private seTracePoint: SEParametricTracePoint;
  private parametricParent: SEParametric;
  private seStartLabel: SELabel;
  private seEndLabel: SELabel;
  private seTraceLabel: SELabel;
  constructor(
    parametricParent: SEParametric,
    startEndPoint: SEParametricEndPoint,
    startLabel: SELabel,
    endEndPoint: SEParametricEndPoint,
    endLabel: SELabel,
    tracePoint: SEParametricTracePoint,
    traceLabel: SELabel
  ) {
    super();
    this.seStartEndPoint = startEndPoint;
    this.seEndEndPoint = endEndPoint;
    this.parametricParent = parametricParent;
    this.seStartLabel = startLabel;
    this.seEndLabel = endLabel;
    this.seTracePoint = tracePoint;
    this.seTraceLabel = traceLabel;
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
    this.seStartEndPoint.markKidsOutOfDate();
    this.seStartEndPoint.update();
    this.seEndEndPoint.markKidsOutOfDate();
    this.seEndEndPoint.update();
    this.seTracePoint.markKidsOutOfDate();
    this.seTracePoint.update();
  }

  saveState(): void {
    this.lastState = this.seStartEndPoint.id;
  }

  restoreState(): void {
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

  // toOpcode(): null | string | Array<string> {
  //   return [
  //     "AddParametricEndPoints",
  //     /* arg-1 */ this.parametricParent.name,

  //     /* arg-2 */ this.seStartEndPoint.name,
  //     /* arg-3 */ this.seStartEndPoint.locationVector.toFixed(7),
  //     /* arg-4 */ this.seStartEndPoint.showing,
  //     /* arg-5 */ this.seStartEndPoint.exists,

  //     /* arg-6 */ this.seEndEndPoint.name,
  //     /* arg-7 */ this.seEndEndPoint.locationVector.toFixed(7),
  //     /* arg-8 */ this.seEndEndPoint.showing,
  //     /* arg-9 */ this.seEndEndPoint.exists,

  //     /* arg-10 */ this.seTracePoint.name,
  //     /* arg-11 */ this.seTracePoint.locationVector.toFixed(7),
  //     /* arg-12 */ this.seTracePoint.showing,
  //     /* arg-13 */ this.seTracePoint.exists,

  //     /* arg-14 */ this.seStartLabel.name,
  //     /* arg-15 */ this.seStartLabel.showing,
  //     /* arg-16 */ this.seStartLabel.exists,

  //     /* arg-17 */ this.seEndLabel.name,
  //     /* arg-18 */ this.seEndLabel.showing,
  //     /* arg-19 */ this.seEndLabel.exists,

  //     /* arg-20 */ this.seTraceLabel.name,
  //     /* arg-21 */ this.seTraceLabel.showing,
  //     /* arg-22 */ this.seTraceLabel.exists
  //   ].join("/");
  // }

  toOpcode(): null | string | Array<string> {
    // console.log(
    //   "Command.symbolToASCIIDec(this.seStartEndPoint.name)",
    //   Command.symbolToASCIIDec(this.seStartEndPoint.name)
    // );
    return [
      "AddParametricEndPoints",
      //Parent Info
      "parametricEndPointParametricParentName=" +
        Command.symbolToASCIIDec(this.parametricParent.name),

      //StartEndPoint Info
      "parametricEndPointseStartEndPointName=" +
        Command.symbolToASCIIDec(this.seStartEndPoint.name),
      "parametricEndPointseStartEndPointLocationVector=" +
        this.seStartEndPoint.locationVector.toFixed(7),
      "parametricEndPointseStartEndPointShowing=" +
        this.seStartEndPoint.showing,
      "parametricEndPointseStartEndPointExists=" + this.seStartEndPoint.exists,
      "parametricEndPointseStartEndPointFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seStartEndPoint.ref.currentStyleState(StyleEditPanels.Front)
          )
        ),
      "parametricEndPointseStartEndPointBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seStartEndPoint.ref.currentStyleState(StyleEditPanels.Back)
          )
        ),

      //EndEndPoint Info
      "parametricEndPointseEndEndPointName=" +
        Command.symbolToASCIIDec(this.seEndEndPoint.name),
      "parametricEndPointseEndEndPointLocationVector=" +
        this.seEndEndPoint.locationVector.toFixed(7),
      "parametricEndPointseEndEndPointShowing=" + this.seEndEndPoint.showing,
      "parametricEndPointseEndEndPointExists=" + this.seEndEndPoint.exists,
      "parametricEndPointseEndEndPointFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seEndEndPoint.ref.currentStyleState(StyleEditPanels.Front)
          )
        ),
      "parametricEndPointseEndEndPointBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seEndEndPoint.ref.currentStyleState(StyleEditPanels.Back)
          )
        ),

      //TracePoint Info
      "parametricEndPointseTracePointName=" +
        Command.symbolToASCIIDec(this.seTracePoint.name),
      "parametricEndPointseTracePointLocationVector=" +
        this.seTracePoint.locationVector.toFixed(7),
      "parametricEndPointseTracePointShowing=" + this.seTracePoint.showing,
      "parametricEndPointseTracePointExists=" + this.seTracePoint.exists,
      "parametricEndPointseTracePointFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seTracePoint.ref.currentStyleState(StyleEditPanels.Front)
          )
        ),
      "parametricEndPointseTracePointBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seTracePoint.ref.currentStyleState(StyleEditPanels.Back)
          )
        ),

      //Start End Point Label Info
      "parametricEndPointseStartLabelName=" +
        Command.symbolToASCIIDec(this.seStartLabel.name),
      "parametricEndPointseStartLabelLocationVector=" +
        this.seStartLabel.locationVector.toFixed(7),
      "parametricEndPointseStartLabelShowing=" + this.seStartLabel.showing,
      "parametricEndPointseStartLabelExists=" + this.seStartLabel.exists,
      "parametricEndPointseStartLabelLabelStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seStartLabel.ref.currentStyleState(StyleEditPanels.Label)
          )
        ),

      //End End Point Label Info
      "parametricEndPointseEndLabelName=" +
        Command.symbolToASCIIDec(this.seEndLabel.name),
      "parametricEndPointseEndLabelLocationVector=" +
        this.seEndLabel.locationVector.toFixed(7),
      "parametricEndPointseEndLabelShowing=" + this.seEndLabel.showing,
      "parametricEndPointseEndLabelExists=" + this.seEndLabel.exists,
      "parametricEndPointseEndLabelLabelStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seEndLabel.ref.currentStyleState(StyleEditPanels.Label)
          )
        ),

      //Trace Point Label Info
      "parametricEndPointseTraceLabelName=" +
        Command.symbolToASCIIDec(this.seTraceLabel.name),
      "parametricEndPointseTraceLabelLocationVector=" +
        this.seTraceLabel.locationVector.toFixed(7),
      "parametricEndPointseTraceLabelShowing=" + this.seTraceLabel.showing,
      "parametricEndPointseTraceLabelExists=" + this.seTraceLabel.exists,
      "parametricEndPointseTraceLabelLabelStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seTraceLabel.ref.currentStyleState(StyleEditPanels.Label)
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
      const startEndPoint = new Point();
      const seStartEndPoint = new SEParametricEndPoint(
        startEndPoint,
        parametricParent,
        "min"
      );
      const seStartEndPointLocation = new Vector3();
      seStartEndPointLocation.from(
        propMap.get("parametricEndPointseStartEndPointLocationVector")
      ); // convert to vector
      seStartEndPoint.locationVector.copy(seStartEndPointLocation);
      let pointFrontStyleString = propMap.get(
        "parametricEndPointseStartEndPointFrontStyle"
      );
      if (pointFrontStyleString !== undefined)
        startEndPoint.updateStyle(
          StyleEditPanels.Front,
          JSON.parse(pointFrontStyleString)
        );
      let pointBackStyleString = propMap.get(
        "parametricEndPointseStartEndPointBackStyle"
      );
      if (pointBackStyleString !== undefined)
        startEndPoint.updateStyle(
          StyleEditPanels.Back,
          JSON.parse(pointBackStyleString)
        );

      // make the Start End Point Label
      const startEndPointLabel = new Label();
      const seStartEndPointLabel = new SELabel(
        startEndPointLabel,
        seStartEndPoint
      );
      const seStartEndPointLabelLocation = new Vector3();
      seStartEndPointLabelLocation.from(
        propMap.get("parametricEndPointseStartLabelLocationVector")
      ); // convert to vector
      seStartEndPointLabel.locationVector.copy(seStartEndPointLabelLocation);
      let labelStyleString = propMap.get(
        "parametricEndPointseStartLabelLabelStyle"
      );
      if (labelStyleString !== undefined) {
        startEndPointLabel.updateStyle(
          StyleEditPanels.Label,
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

      // make the End End Point
      const endEndPoint = new Point();
      const seEndEndPoint = new SEParametricEndPoint(
        endEndPoint,
        parametricParent,
        "max"
      );
      const seEndEndPointLocation = new Vector3();
      seEndEndPointLocation.from(
        propMap.get("parametricEndPointseEndEndPointLocationVector")
      ); // convert to vector
      seEndEndPoint.locationVector.copy(seEndEndPointLocation);
      pointFrontStyleString = propMap.get(
        "parametricEndPointseEndEndPointFrontStyle"
      );
      if (pointFrontStyleString !== undefined)
        endEndPoint.updateStyle(
          StyleEditPanels.Front,
          JSON.parse(pointFrontStyleString)
        );
      pointBackStyleString = propMap.get(
        "parametricEndPointseEndEndPointBackStyle"
      );
      if (pointBackStyleString !== undefined)
        endEndPoint.updateStyle(
          StyleEditPanels.Back,
          JSON.parse(pointBackStyleString)
        );

      // make the End End Point Label
      const endEndPointLabel = new Label();
      const seEndEndPointLabel = new SELabel(endEndPointLabel, seEndEndPoint);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(
        propMap.get("parametricEndPointseEndLabelLocationVector")
      ); // convert to vector
      seEndEndPointLabel.locationVector.copy(seLabelLocation);
      labelStyleString = propMap.get("parametricEndPointseEndLabelLabelStyle");
      if (labelStyleString !== undefined) {
        endEndPointLabel.updateStyle(
          StyleEditPanels.Label,
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

      // make the Trace Point
      const tracePoint = new Point();
      const seTracePoint = new SEParametricTracePoint(
        tracePoint,
        parametricParent
      );
      const seTracePointLocation = new Vector3();
      seTracePointLocation.from(
        propMap.get("parametricEndPointseTracePointLocationVector")
      ); // convert to vector
      seTracePoint.locationVector.copy(seTracePointLocation);
      pointFrontStyleString = propMap.get(
        "parametricEndPointseTracePointFrontStyle"
      );
      if (pointFrontStyleString !== undefined)
        tracePoint.updateStyle(
          StyleEditPanels.Front,
          JSON.parse(pointFrontStyleString)
        );
      pointBackStyleString = propMap.get(
        "parametricEndPointseTracePointBackStyle"
      );
      if (pointBackStyleString !== undefined)
        tracePoint.updateStyle(
          StyleEditPanels.Back,
          JSON.parse(pointBackStyleString)
        );

      // make the Trace Point Label
      const tracePointLabel = new Label();
      const seTracePointLabel = new SELabel(tracePointLabel, seTracePoint);
      const seTracePointLabelLocation = new Vector3();
      seLabelLocation.from(
        propMap.get("parametricEndPointseTraceLabelLocationVector")
      ); // convert to vector
      seTracePointLabel.locationVector.copy(seTracePointLabelLocation);
      labelStyleString = propMap.get(
        "parametricEndPointseTraceLabelLabelStyle"
      );
      if (labelStyleString !== undefined) {
        tracePointLabel.updateStyle(
          StyleEditPanels.Label,
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
        seTracePointLabel
      );
    } else {
      throw new Error(
        `AddParametricEndPoints: parametric parent ${parametricParent} is undefined`
      );
    }
  }

  // static parse(command: string, objMap: Map<string, SENodule>): Command {
  //   const tokens = command.split("/");
  //   const parametricParent = objMap.get(tokens[1]) as SEParametric | undefined;
  //   if (parametricParent) {
  //     const startPosition = new Vector3();
  //     startPosition.from(tokens[3]);
  //     // const { point, label } = Command.makePointAndLabel(pointPosition); // We can't use this because we must create a SEParametricEndPoint and not just an SEPoint
  //     const startPoint = new Point();
  //     startPoint.stylize(DisplayStyle.ApplyCurrentVariables);
  //     startPoint.adjustSize();
  //     const seStartPoint = new SEParametricEndPoint(
  //       startPoint,
  //       parametricParent,
  //       "min"
  //     );
  //     seStartPoint.locationVector.copy(startPosition);
  //     seStartPoint.showing = tokens[4] === "true";
  //     seStartPoint.exists = tokens[5] === "true";
  //     seStartPoint.name = tokens[2];
  //     objMap.set(tokens[2], seStartPoint);

  //     const startLabel = new SELabel(new Label(), seStartPoint);
  //     startLabel.locationVector.copy(startPosition);
  //     const offset = SETTINGS.point.initialLabelOffset;
  //     startLabel.locationVector
  //       .add(new Vector3(2 * offset, offset, 0))
  //       .normalize();
  //     startLabel.showing = tokens[15] === "true";
  //     startLabel.exists = tokens[16] === "true";
  //     startLabel.name = tokens[14];
  //     objMap.set(tokens[14], startLabel);

  //     const endPosition = new Vector3();
  //     endPosition.from(tokens[7]);
  //     // const { point, label } = Command.makePointAndLabel(pointPosition); // We can't use this because we must create a SEParametricEndPoint and not just an SEPoint
  //     const endPoint = new Point();
  //     endPoint.stylize(DisplayStyle.ApplyCurrentVariables);
  //     endPoint.adjustSize();
  //     const seEndPoint = new SEParametricEndPoint(
  //       endPoint,
  //       parametricParent,
  //       "max"
  //     );
  //     seEndPoint.locationVector.copy(endPosition);
  //     seEndPoint.showing = tokens[8] === "true";
  //     seEndPoint.exists = tokens[9] === "true";
  //     seEndPoint.name = tokens[6];
  //     objMap.set(tokens[6], seEndPoint);

  //     const endLabel = new SELabel(new Label(), seEndPoint);
  //     endLabel.locationVector.copy(endPosition);
  //     endLabel.locationVector
  //       .add(new Vector3(2 * offset, offset, 0))
  //       .normalize();
  //     endLabel.showing = tokens[18] === "true";
  //     endLabel.exists = tokens[19] === "true";
  //     endLabel.name = tokens[17];
  //     objMap.set(tokens[17], endLabel);

  //     const tracePosition = new Vector3();
  //     tracePosition.from(tokens[11]);
  //     const tracePoint = new Point();
  //     tracePoint.stylize(DisplayStyle.ApplyCurrentVariables);
  //     tracePoint.adjustSize();
  //     const seTracePoint = new SEParametricTracePoint(
  //       tracePoint,
  //       parametricParent
  //     );
  //     seTracePoint.locationVector.copy(tracePosition);
  //     seTracePoint.showing = tokens[12] === "true";
  //     seTracePoint.exists = tokens[13] === "true";
  //     seTracePoint.name = tokens[10];
  //     objMap.set(tokens[10], seTracePoint);

  //     const traceLabel = new SELabel(new Label(), seTracePoint);
  //     traceLabel.locationVector.copy(tracePosition);
  //     traceLabel.locationVector
  //       .add(new Vector3(2 * offset, offset, 0))
  //       .normalize();
  //     traceLabel.showing = tokens[21] === "true";
  //     traceLabel.exists = tokens[22] === "true";
  //     traceLabel.name = tokens[20];
  //     objMap.set(tokens[20], traceLabel);

  //     return new AddParametricEndPointsCommand(
  //       parametricParent,
  //       seStartPoint,
  //       startLabel,
  //       seEndPoint,
  //       endLabel,
  //       seTracePoint,
  //       traceLabel
  //     );
  //   } else {
  //     throw new Error(
  //       `AddParametricEndPoints: parametric parent ${tokens[1]} is undefined`
  //     );
  //   }
  // }
}
