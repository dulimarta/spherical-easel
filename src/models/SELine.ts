import { SENodule } from "./SENodule";
import Line from "@/plottables/Line";
import { Vector3 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { SEPoint } from "./SEPoint";
import SETTINGS from "@/global-settings";

/** Temporary vector3 to help with calculations */
const tmpVector1 = new Vector3();
const tmpVector2 = new Vector3();

let LINE_COUNT = 0;
export class SELine extends SENodule implements Visitable {
  /**
   * The corresponding plottable TwoJS object
   */
  public ref: Line;
  /**
   * The model SE object that is one point on the line
   */
  private startSEPoint: SEPoint;
  /**
   * The model SE object that is a second point on the line
   */
  private endSEPoint: SEPoint;
  /**
   * The Vector3 that the normal vector to the plane of the line
   */
  private normalVector = new Vector3();

  /**
   * Temporary normalVector
   * This holds a candidate normal vector to see so that if updating the line moves the normal too much
   */
  private tempNormalVector = new Vector3(); //

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
    this.startSEPoint = lineStartSEPoint;
    this.normalVector.copy(normalVector);
    this.endSEPoint = lineEndSEPoint;

    LINE_COUNT++;
    this.name = `Li-${LINE_COUNT}`;
    // Place registerChild calls AFTER the name is set
    // so debugging output shows name correctly
    // Add this line as a child of the two points
    lineStartSEPoint.registerChild(this);
    lineEndSEPoint.registerChild(this);
  }

  accept(v: Visitor): void {
    v.actionOnLine(this);
  }

  get normalDirection(): Vector3 {
    return this.ref.normalVector;
  }

  set normalDirection(normalVec: Vector3) {
    this.normalVector.copy(normalVec);
  }

  get startPoint(): SEPoint {
    return this.startSEPoint;
  }

  get endPoint(): SEPoint {
    return this.endSEPoint;
  }

  public isHitAt(sphereVector: Vector3): boolean {
    // Is the sphereVector is perpendicular to the line normal?
    return Math.abs(sphereVector.dot(this.normalVector)) < 1e-2;
  }

  public update(): void {
    if (!this.canUpdateNow()) {
      return;
    }
    this.setOutOfDate(false);
    this.exists = this.startSEPoint.getExists() && this.endSEPoint.getExists();
    if (this.exists) {
      console.debug("Updating line", this.name);
      // Given an set of this.startPoint, this.endPoint and (old) this.normalVector, and compute the next normal vector
      // Compute a temporary normal from the two points
      this.tempNormalVector.crossVectors(
        this.startSEPoint.vectorPosition,
        this.endSEPoint.vectorPosition
      );
      // Check to see if the tempNormal is zero (i.e the start and end vectors are parallel -- ether
      // nearly antipodal or in the same direction)
      if (SENodule.isZero(this.tempNormalVector)) {
        // The start and end vectors align, compute  the next normal vector from the old normal and the start vector
        this.tempNormalVector.crossVectors(
          this.startSEPoint.vectorPosition,
          this.normalVector
        );
        this.tempNormalVector.crossVectors(
          this.tempNormalVector,
          this.startSEPoint.vectorPosition
        );
      }

      this.normalVector.copy(this.tempNormalVector).normalize();

      // set the normal vector in the plottable object (the setter also calls the updateDisplay() method)
      this.ref.normalVector = this.normalVector;
    }

    this.updateKids();
  }
}
