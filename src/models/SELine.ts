import { SENodule } from "./SENodule";
import Line from "@/plottables/Line";
import { Vector3 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { SEPoint } from "./SEPoint";
import SETTINGS from "@/global-settings";
import { OneDimensional } from "@/types";
import { Styles } from "@/types/Styles";

/** Temporary vector3 to help with calculations */
const tmpVector1 = new Vector3();
const tmpVector2 = new Vector3();

let LINE_COUNT = 0;
const styleSet = new Set([Styles.StrokeWidth, Styles.StrokeColor]);
export class SELine extends SENodule implements Visitable, OneDimensional {
  /**
   * The corresponding plottable TwoJS object
   */
  public ref: Line;
  /**
   * The model SE object that is one point on the line
   */
  private _startSEPoint: SEPoint;
  /**
   * The model SE object that is a second point on the line
   */
  private _endSEPoint: SEPoint;
  /**
   * The Vector3 that the normal vector to the plane of the line
   */
  private _normalVector = new Vector3();

  /**
   * Temporary vector for calculations
   * This holds a candidate normal vector to see so that if updating the line moves the normal too much
   */
  private tmpVector = new Vector3(); //

  /**
   *
   * @param line plottable (TwoJS) line associated with this line
   * @param lineStartSEPoint
   * @param lineEndSEPoint
   */
  constructor(
    line: Line,
    lineStartSEPoint: SEPoint,
    normalVector: Vector3,
    lineEndSEPoint: SEPoint
  ) {
    super();
    this.ref = line;
    this._startSEPoint = lineStartSEPoint;
    this._normalVector.copy(normalVector);
    this._endSEPoint = lineEndSEPoint;

    LINE_COUNT++;
    this.name = `Li-${LINE_COUNT}`;
    // Place registerChild calls AFTER the name is set
    // so debugging output shows name correctly
    // Add this line as a child of the two points
    lineStartSEPoint.registerChild(this);
    lineEndSEPoint.registerChild(this);
  }

  customStyles(): Set<Styles> {
    return styleSet;
  }

  accept(v: Visitor): void {
    v.actionOnLine(this);
  }

  get normalVector(): Vector3 {
    return this._normalVector;
  }

  set normalVector(normalVec: Vector3) {
    this._normalVector.copy(normalVec);
  }

  get startSEPoint(): SEPoint {
    return this._startSEPoint;
  }

  get endSEPoint(): SEPoint {
    return this._endSEPoint;
  }

  public isHitAt(unitIdealVector: Vector3): boolean {
    // Is the sphereVector is perpendicular to the line normal?
    return Math.abs(unitIdealVector.dot(this._normalVector)) < 1e-2;
  }

  /**
   * Return the vector on the SELine that is closest to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector on the unit sphere
   */
  public closestVector(idealUnitSphereVector: Vector3): Vector3 {
    // The normal to the plane of the normal vector and the idealUnitVector
    this.tmpVector.crossVectors(this._normalVector, idealUnitSphereVector);

    // Check to see if the tmpVector is zero (i.e the normal and  idealUnit vectors are parallel -- ether
    // nearly antipodal or in the same direction)
    if (this.tmpVector.isZero()) {
      return this._endSEPoint.locationVector; // An arbitrary point will do as all points are equally far away
    } else {
      // Make the tmpVector unit
      this.tmpVector.normalize();
      return this.tmpVector.cross(this._normalVector).normalize();
    }
  }

  public update(): void {
    if (!this.canUpdateNow()) {
      return;
    }
    this.setOutOfDate(false);
    this._exists = this._startSEPoint.exists && this._endSEPoint.exists;
    if (this._exists) {
      console.debug("Updating line", this.name);
      // Given an set of this.startPoint, this.endPoint and (old) this.normalVector, and compute the next normal vector
      // Compute a temporary normal from the two points
      this.tmpVector.crossVectors(
        this._startSEPoint.locationVector,
        this._endSEPoint.locationVector
      );
      // Check to see if the tempNormal is zero (i.e the start and end vectors are parallel -- ether
      // nearly antipodal or in the same direction)
      if (this.tmpVector.isZero()) {
        // The start and end vectors align, compute  the next normal vector from the old normal and the start vector
        this.tmpVector.crossVectors(
          this._startSEPoint.locationVector,
          this._normalVector
        );
        this.tmpVector.crossVectors(
          this.tmpVector,
          this._startSEPoint.locationVector
        );
      }

      this._normalVector.copy(this.tmpVector).normalize();

      // Set the normal vector in the plottable object (the setter also calls the updateDisplay() method)
      this.ref.normalVector = this._normalVector;
      if (this.showing) {
        this.ref.updateDisplay();
        this.ref.setVisible(true);
      } else {
        this.ref.setVisible(false);
      }
    } else {
      this.ref.setVisible(false);
    }

    this.updateKids();
  }
}
