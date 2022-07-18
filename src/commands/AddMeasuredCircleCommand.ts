import { Command } from "./Command";
import { SECircle } from "@/models/SECircle";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import Label from "@/plottables/Label";
import { StyleEditPanels } from "@/types/Styles";
import { SavedNames } from "@/types";
import { SEExpression } from "@/models/SEExpression";
import NonFreeCircle from "@/plottables/NonFreeCircle";
import { SEMeasuredCircle } from "@/models/SEMeasuredCircle";
import NonFreePoint from "@/plottables/NonFreePoint";

export class AddMeasuredCircleCommand extends Command {
  private seCircle: SECircle;
  private centerSEPoint: SEPoint;
  private measurementSEExpression: SEExpression;
  private seLabel: SELabel;

  constructor(
    seCircle: SECircle,
    centerSEPoint: SEPoint,
    measurementSEExpression: SEExpression,
    seLabel: SELabel
  ) {
    super();
    this.seCircle = seCircle;
    this.centerSEPoint = centerSEPoint;
    this.measurementSEExpression = measurementSEExpression;
    this.seLabel = seLabel;
  }

  do(): void {
    this.centerSEPoint.registerChild(this.seCircle);
    this.measurementSEExpression.registerChild(this.seCircle);
    this.seCircle.registerChild(this.seLabel);
    Command.store.addCircle(this.seCircle);
    Command.store.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.seCircle.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removeCircle(this.lastState);
    this.seCircle.unregisterChild(this.seLabel);
    this.centerSEPoint.unregisterChild(this.seCircle);
    this.measurementSEExpression.unregisterChild(this.seCircle);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddMeasuredCircle",
      // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seCircle.name),
      "objectExists=" + this.seCircle.exists,
      "objectShowing=" + this.seCircle.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seCircle.ref.currentStyleState(StyleEditPanels.Front)
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seCircle.ref.currentStyleState(StyleEditPanels.Back)
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
      "circleCenterPointName=" + this.centerSEPoint.name,
      "measuredCircleRadiusExpression=" + this.measurementSEExpression.name
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
    const circleCenterPoint = objMap.get(
      propMap.get("circleCenterPointName") ?? ""
    ) as SEPoint | undefined;

    const radiusExpression = objMap.get(
      propMap.get("measuredCircleRadiusExpression") ?? ""
    ) as SEExpression | undefined;

    if (circleCenterPoint && radiusExpression) {
      // make the hidden circle point
      // create the circle point on the measured circle
      // this point is never visible and is not in the DAG
      // it is only updated when the the new SEMeasuredCircle is updated.
      const hiddenSEPoint = new SEPoint(new NonFreePoint());
      hiddenSEPoint.showing = false; // this never changes
      hiddenSEPoint.exists = true; // this never changes
      // compute the location of the hiddenSEPoint using radiusExpression.value.modPi();
      const newRadius = radiusExpression.value.modPi();
      // compute a normal to the centerVector, named tmpVector
      this.tmpVector.set(
        -circleCenterPoint.locationVector.y,
        circleCenterPoint.locationVector.x,
        0
      );
      // check to see if this vector is zero, if so choose a different way of being perpendicular to the polar point parent
      if (this.tmpVector.isZero()) {
        this.tmpVector.set(
          0,
          -circleCenterPoint.locationVector.z,
          circleCenterPoint.locationVector.y
        );
      }
      this.tmpVector.normalize();
      this.tmpVector1
        .copy(circleCenterPoint.locationVector)
        .multiplyScalar(Math.cos(newRadius));
      this.tmpVector1.addScaledVector(this.tmpVector, Math.sin(newRadius));
      hiddenSEPoint.locationVector = this.tmpVector1.normalize();

      //make the circle
      const circle = new NonFreeCircle();
      const seCircle = new SEMeasuredCircle(
        circle,
        circleCenterPoint,
        hiddenSEPoint,
        radiusExpression
      );
      //style the circle
      const circleFrontStyleString = propMap.get("objectFrontStyle");
      if (circleFrontStyleString !== undefined)
        circle.updateStyle(
          StyleEditPanels.Front,
          JSON.parse(circleFrontStyleString)
        );
      const circleBackStyleString = propMap.get("objectBackStyle");
      if (circleBackStyleString !== undefined)
        circle.updateStyle(
          StyleEditPanels.Back,
          JSON.parse(circleBackStyleString)
        );

      //make the label and set its location
      const label = new Label("circle", seCircle.name);
      const seLabel = new SELabel(label, seCircle);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      seLabel.locationVector.copy(seLabelLocation);
      //style the label
      const labelStyleString = propMap.get("labelStyle");
      if (labelStyleString !== undefined)
        label.updateStyle(StyleEditPanels.Label, JSON.parse(labelStyleString));

      //put the circle in the object map
      if (propMap.get("objectName") !== undefined) {
        seCircle.name = propMap.get("objectName") ?? "";
        seCircle.showing = propMap.get("objectShowing") === "true";
        seCircle.exists = propMap.get("objectExists") === "true";
        objMap.set(seCircle.name, seCircle);
      } else {
        throw new Error("AddMeasureCircle: Circle Name doesn't exist");
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        seLabel.name = propMap.get("labelName") ?? "";
        seLabel.showing = propMap.get("labelShowing") === "true";
        seLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(seLabel.name, seLabel);
      } else {
        throw new Error("AddCircle: Label Name doesn't exist");
      }
      return new AddMeasuredCircleCommand(
        seCircle,
        circleCenterPoint,
        radiusExpression,
        seLabel
      );
    }
    throw new Error(
      `AddCircle: ${circleCenterPoint} or ${radiusExpression} is undefined`
    );
  }
}
