import Label from "../plottables/Label";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { SENodule } from "./SENodule";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";
import { DEFAULT_LABEL_TEXT_STYLE } from "@/types/Styles";
import {
  LabelDisplayMode,
  LabelParentTypes,
  Labelable,
  ObjectState
} from "@/types";
import { SESegment } from "./SESegment";
import { SELine } from "./SELine";
import { SECircle } from "./SECircle";
import { SEAngleMarker } from "./SEAngleMarker";
import { SEEllipse } from "./SEEllipse";
import { SEParametric } from "./SEParametric";
import { SEPolygon } from "./SEPolygon";
import { SEEarthPoint } from "./SEEarthPoint";
import { SELatitude } from "./SELatitude";
import { SELongitude } from "./SELongitude";
import { SEPoint } from "./SEPoint";

const styleSet = new Set([
  ...Object.getOwnPropertyNames(DEFAULT_LABEL_TEXT_STYLE)
  // ...Object.getOwnPropertyNames(DEFAULT_LABEL_FRONT_STYLE),
  // ...Object.getOwnPropertyNames(DEFAULT_LABEL_BACK_STYLE)
]);

export class SELabel extends SENodule implements Visitable {
  /* Access to the store to retrieve the canvas size so that the bounding rectangle for the text can be computed properly*/
  // protected store = AppStore;

  /* This should be the only reference to the plotted version of this SELabel */
  declare public ref: Label;
  /**
   * The  parent of this SELabel
   */
  public parent: SENodule;
  /**
   * The vector location of the SEPoint on the ideal unit sphere
   */
  protected _locationVector = new Vector3();

  private tmpVector = new Vector3();
  /**
   * Create a label of the parent object
   * @param label the TwoJS label associated with this SELabel
   * @param parent The parent SENodule object
   */
  constructor(labelType: LabelParentTypes, parent: SENodule) {
    super();
    // Name of the plottable should borrow the parent name
    const label = new Label(parent.name, labelType);
    this.ref = label;
    this.parent = parent;

    (this.parent as unknown as Labelable).label = this;
    SENodule.LABEL_COUNT++;
    this.name = "La" + SENodule.LABEL_COUNT;

    // set the Label shortUserName as the name of the parent object initially
    if (this.parent instanceof SEAngleMarker) {
      // Angle Markers are an exception which are both plottable and an expression.
      // As expressions MUST have a name of a measurement token (ie. M###), we can't
      // use the parent name for the short name, so to get around this we use  this
      // and the angleMarkerNumber.
      label.shortUserName = `Am${this.parent.angleMarkerNumber}`;
      label.defaultName = `Am${this.parent.angleMarkerNumber}`;
      label.value = [this.parent.value];
    } else if (this.parent instanceof SEPolygon) {
      // polygons are an exception which are both plottable and an expression.
      // As expressions MUST have a name of a measurement token (ie. M###), we can't
      // use the parent name for the short name, so to get around this we use  this
      // and the angleMarkerNumber.
      label.shortUserName = `Po${this.parent.polygonNumber}`;
      label.defaultName = `Po${this.parent.polygonNumber}`;
    } else {
      if (!(this.parent instanceof SEPoint)) {
        label.shortUserName = parent.name; // the short user name of a point's label is set else where via point visible count
      }
      label.shortUserName = this.parent.name; // if this line isn't here then the antipodal point tool creates a point (with a label) and an antipodal point (***without*** a label)
      label.defaultName = this.parent.name;
    }
    // Set the size for zoom
    label.adjustSize();

    // Display the label initially (both showing or not or the mode)
    if (parent instanceof SEPoint) {
      if (parent instanceof SEEarthPoint) {
        this.ref.initialLabelDisplayMode = LabelDisplayMode.CaptionOnly;
        this.showing = true;
      } else {
        this.ref.initialLabelDisplayMode = SETTINGS.point.defaultLabelMode;
        if (parent.isFreePoint()) {
          this.showing = SETTINGS.point.showLabelsOfFreePointsInitially;
        } else {
          this.showing = SETTINGS.point.showLabelsOfNonFreePointsInitially;
        }
      }
    } else if (parent instanceof SELine) {
      this.ref.initialLabelDisplayMode = SETTINGS.line.defaultLabelMode;
      this.showing = SETTINGS.line.showLabelsInitially;
    } else if (parent instanceof SESegment) {
      if (parent instanceof SELongitude) {
        this.ref.initialLabelDisplayMode = LabelDisplayMode.CaptionOnly;
        this.showing = true;
      } else {
        this.ref.initialLabelDisplayMode = SETTINGS.segment.defaultLabelMode;
        this.showing = SETTINGS.segment.showLabelsInitially;
      }
    } else if (parent instanceof SECircle) {
      if (parent instanceof SELatitude) {
        this.ref.initialLabelDisplayMode = LabelDisplayMode.CaptionOnly;
        this.showing = true;
      } else {
        this.ref.initialLabelDisplayMode = SETTINGS.circle.defaultLabelMode;
        this.showing = SETTINGS.circle.showLabelsInitially;
      }
    } else if (parent instanceof SEAngleMarker) {
      this.ref.initialLabelDisplayMode = SETTINGS.angleMarker.defaultLabelMode;
      this.showing = SETTINGS.angleMarker.showLabelsInitially;
    } else if (parent instanceof SEEllipse) {
      this.ref.initialLabelDisplayMode = SETTINGS.ellipse.defaultLabelMode;
      this.showing = SETTINGS.ellipse.showLabelsInitially;
    } else if (parent instanceof SEParametric) {
      this.ref.initialLabelDisplayMode = SETTINGS.parametric.defaultLabelMode;
      this.showing = SETTINGS.parametric.showLabelsInitially;
    } else if (parent instanceof SEPolygon) {
      this.ref.initialLabelDisplayMode = SETTINGS.polygon.defaultLabelMode;
      this.showing = SETTINGS.polygon.showLabelsInitially;
    } else {
      this.showing = true;
    }
  }

  customStyles(): Set<string> {
    return styleSet;
  }

  /**
   * When undoing or redoing a move, we do *not* want to use the "set locationVector" method because
   * that will set the position on a potentially out of date object. We will trust that we do not need to
   * use the closest point method and that the object that this point depends on will be move under this point (if necessary)
   * @param pos The new position of the point
   */
  public labelDirectLocationSetter(pos: Vector3): void {
    // Record the location on the unit ideal sphere of this SEPoint
    this._locationVector.copy(pos).normalize();
    // Set the position of the associated displayed plottable Point
    this.ref.positionVector = this._locationVector;
    if (this.showing) {
      this.ref.updateDisplay();
    }
  }

  accept(v: Visitor): boolean {
    return v.actionOnLabel(this);
  }

  public shallowUpdate(): void {
    //These labels don't exist when their parent doesn't exist
    this._exists = this.parent.exists;
    if (this._exists) {
      this.tmpVector.copy(this._locationVector);
      this._locationVector.copy(
        (this.parent as unknown as Labelable).closestLabelLocationVector(
          this.tmpVector,
          SENodule.store.zoomMagnificationFactor
        )
      );
      //Update the location of the associate plottable Label
      this.ref.positionVector = this._locationVector;
      if (this.showing) {
        this.ref.updateDisplay();
      }
    }

    // Update visibility
    if (this.showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // console.log("update SElabel");
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);
    this.shallowUpdate();

    // Labels are NOT completely determined by their parents so we store additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        // `Label with id ${this.id} has been visited twice proceed no further down this branch of the DAG. Hopefully this is because we are moving two or more SENodules at the same time in the MoveHandler.`
        return;
      }
      orderedSENoduleList.push(this.id);
      const location = new Vector3();
      location.copy(this._locationVector);
      objectState.set(this.id, {
        kind: "label",
        object: this,
        locationVector: location
      });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }

  /**
   * Set or get the location vector of the SEPoint on the unit ideal sphere
   */
  set locationVector(pos: Vector3) {
    // Record the location on the unit ideal sphere of this SELabel
    // If the parent is not out of date, use the closest vector, if not set the location directly
    // and the program will update the parent later so that the set location is on the parent (even though it is
    // at the time of execution)
    if (!this.parent.isOutOfDate()) {
      this._locationVector
        .copy(
          (this.parent as unknown as Labelable).closestLabelLocationVector(
            pos,
            SENodule.store.zoomMagnificationFactor
          )
        )
        .normalize();
    } else {
      this._locationVector.copy(pos);
    }
    // Set the position of the associated displayed plottable Label
    this.ref.positionVector = this._locationVector;
    if (this.showing) {
      this.ref.updateDisplay();
    }
  }
  get locationVector(): Vector3 {
    return this._locationVector;
  }

  public get noduleDescription(): string {
    throw new Error("SELabel noduleDescription should never be called");
  }

  public get noduleItemText(): string {
    throw new Error("SELabel noduleItemText should never be called");
  }
  public isHitAt(
    unitIdealVector: Vector3,
    currentMagnificationFactor: number
  ): boolean {
    // First check to see if the label and the unitIdealVector are on the same side of the sphere
    if (unitIdealVector.z * this._locationVector.z < 0) return false;

    // Get the bounding box of the text
    const boundingBox = this.ref.boundingRectangle;
    // Get the canvas size so the bounding box can be corrected
    // console.log("SELabel.store.getters", this.store);
    const canvasWidth = SENodule.store.canvasWidth;
    const canvasHeight = SENodule.store.canvasHeight;
    const zoomTranslation = SENodule.store.zoomTranslation;

    return (
      boundingBox.left - canvasWidth / 2 <
        unitIdealVector.x *
          SETTINGS.boundaryCircle.radius *
          currentMagnificationFactor +
          zoomTranslation[0] &&
      unitIdealVector.x *
        SETTINGS.boundaryCircle.radius *
        currentMagnificationFactor +
        zoomTranslation[0] <
        boundingBox.right - canvasWidth / 2 &&
      boundingBox.top - canvasHeight / 2 <
        -unitIdealVector.y *
          SETTINGS.boundaryCircle.radius *
          currentMagnificationFactor +
          zoomTranslation[1] && // minus sign because text layers are not y flipped
      -unitIdealVector.y *
        SETTINGS.boundaryCircle.radius *
        currentMagnificationFactor +
        zoomTranslation[1] < // minus sign because text layers are not y flipped
        boundingBox.bottom - canvasHeight / 2
    );
  }

  //The following function fixes the issue https://github.com/dulimarta/spherical-easel/issues/76
  public isFreeToMove(): boolean {
    return true;
  }
}
