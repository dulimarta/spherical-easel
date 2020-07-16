import { SENodule } from "./SENodule";
import Segment from "@/plottables/Segment";
import { Vector3 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { SEPoint } from "./SEPoint";
import SETTINGS from "@/global-settings";
import { OneDimensional } from "@/types";

import { Styles } from "@/types/Styles";

let SEGMENT_COUNT = 0;
const styleSet = new Set([Styles.StrokeWidth, Styles.StrokeColor]);
export class SESegment extends SENodule implements Visitable, OneDimensional {
  /**
   * The plottable (TwoJS) segment associated with this model segment
   */
  public ref: Segment;
  /**
   * The model SE object that is the start of the segment
   */
  private _startSEPoint: SEPoint;

  /**
   * The model SE object that is the end of the segment
   */
  private _endSEPoint: SEPoint;

  /**
   * The Vector3 normal to the plane containing the segment.
   * NOTE: normalVector x startVector*(arcLength > pi ? -1 :1) give the direction in which the segment is drawn
   */
  private _normalVector = new Vector3();
  /**
   * The arcLength of the segment
   */
  private arcLength = 0;

  /**
   * To update from one position to another (i.e. from one update() to the next), we need to remember if the
   * SEEndPoint were nearlyAntipodal or not. See "Right here is why we need this from one update to the next!" in the
   * comments below.
   */
  private nearlyAntipodal = false;
  /**
   * Temporary vectors to help with calculations
   */
  private tmpVector = new Vector3();
  private toVector = new Vector3();
  private tmpVector1 = new Vector3(); // closest point calls onSegment so that must have different tmpVectors

  /**
   * Create a model SESegment using:
   * @param seg  The plottable TwoJS Object associated to this object
   * @param segmentStartSEPoint The model SEPoint object that is the start of the segment
   * @param segmentNormalVector The vector3 that is perpendicular to the plane containing the segment
   * @param segmentArcLength The arcLength number of the segment
   * @param segmentEndSEPoint The model SEPoint object that is the end of the segment
   */
  constructor(
    seg: Segment,
    segmentStartSEPoint: SEPoint,
    segmentNormalVector: Vector3,
    segmentArcLength: number,
    segmentEndSEPoint: SEPoint
  ) {
    super();
    this.ref = seg;
    this._startSEPoint = segmentStartSEPoint;
    this._normalVector.copy(segmentNormalVector);
    this.arcLength = segmentArcLength;
    this._endSEPoint = segmentEndSEPoint;

    SEGMENT_COUNT++;
    this.name = `Ls-${SEGMENT_COUNT}`;

    // Place registerChild calls AFTER the name is set
    // so debugging output shows name correctly
    segmentStartSEPoint.registerChild(this);
    segmentEndSEPoint.registerChild(this);
  }

  customStyles(): Set<Styles> {
    return styleSet;
  }

  accept(v: Visitor): void {
    v.actionOnSegment(this);
  }

  get startSEPoint(): SEPoint {
    return this._startSEPoint;
  }

  get endSEPoint(): SEPoint {
    return this._endSEPoint;
  }

  get normalVector(): Vector3 {
    return this._normalVector;
  }

  public isHitAt(unitIdealVector: Vector3): boolean {
    // Is the unitIdealVector is perpendicular to the normal to the plane containing the segment?
    if (Math.abs(unitIdealVector.dot(this._normalVector)) > 1e-2) return false;

    // Is the unitIdealVector inside the radius arcLength/2 circle about the midVector?
    // NOTE: normalVector x startVector *(this.arcLength > Math.PI ? -1 : 1)
    // gives the direction in which the segment is drawn
    this.toVector
      .crossVectors(this._normalVector, this._startSEPoint.locationVector)
      .multiplyScalar(this.arcLength > Math.PI ? -1 : 1);
    // midVector = tmpVector = cos(arcLength/2)*start + sin(arcLength/2)*toVector
    this.tmpVector
      .copy(this._startSEPoint.locationVector)
      .multiplyScalar(Math.cos(this.arcLength / 2));
    this.tmpVector.addScaledVector(this.toVector, Math.sin(this.arcLength / 2));

    return (
      this.tmpVector.angleTo(unitIdealVector) <
      this.arcLength / 2 + SETTINGS.segment.hitIdealDistance
    );
  }

  /**
   * Given a unit vector in the plane containing the segment, is it on the segment?
   * @param unitIdealVector A vector *on* the line containing the segment
   */
  public onSegment(unitIdealVector: Vector3): boolean {
    // Is the unitIdealVector inside the radius arcLength/2 circle about the midVector?
    // NOTE: normalVector x startVector * (this.arcLength > Math.PI ? -1 : 1)
    // gives the direction in which the segment is drawn

    this.toVector
      .crossVectors(this._normalVector, this._startSEPoint.locationVector)
      .multiplyScalar(this.arcLength > Math.PI ? -1 : 1);
    // midVector = tmpVector = cos(arcLength/2)*start + sin(arcLength/2)*this.toVector
    this.tmpVector
      .copy(this._startSEPoint.locationVector)
      .multiplyScalar(Math.cos(this.arcLength / 2));
    this.tmpVector.addScaledVector(this.toVector, Math.sin(this.arcLength / 2));

    // console.debug("start vec", this._startSEPoint.locationVector.toFixed(2));
    // console.debug("toVector", this.toVector.toFixed(2));
    // console.debug("arclengh", this.arcLength);
    // console.debug("midPoint", this.tmpVector.toFixed(2));

    return this.tmpVector.angleTo(unitIdealVector) <= this.arcLength / 2;
  }

  /**
   * Return the vector on the SESegment that is closest to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector on the unit sphere
   */
  public closestVector(idealUnitSphereVector: Vector3): Vector3 {
    // The normal to the plane of the normal vector to the plane containing the segment and the idealUnitVector
    this.tmpVector1.crossVectors(this._normalVector, idealUnitSphereVector);
    // Check to see if the tmpVector is zero (i.e the normal and  idealUnit vectors are parallel -- ether
    // nearly antipodal or in the same direction)
    if (this.tmpVector1.isZero()) {
      return this._endSEPoint.locationVector; // An arbitrary point will do as all points are equally far away
    } else {
      // Make the tmpVector (soon to be the to vector) unit
      this.tmpVector1.normalize();
      // The vector that is closest to the idealUnitSphereVector in the plane of the segment
      this.tmpVector1.cross(this._normalVector).normalize();
      // If this tmpVector is onSegment then return it, otherwise the closest endpoint is the correct return
      if (this.onSegment(this.tmpVector1)) {
        return this.tmpVector1;
      } else if (
        this.tmpVector1.angleTo(this._startSEPoint.locationVector) <
        this.tmpVector1.angleTo(this._endSEPoint.locationVector)
      ) {
        return this._startSEPoint.locationVector;
      } else {
        return this._endSEPoint.locationVector;
      }
    }
  }

  public update(): void {
    if (!this.canUpdateNow()) {
      return;
    }
    this.setOutOfDate(false);
    this._exists = this._startSEPoint.exists && this._endSEPoint.exists;
    if (this._exists) {
      console.debug("Updating segment", this.name);

      //////////////// This is  essentially setArcLengthAndNormalVector from segmentHandler/////////////////
      // Compute the normal vector from the this.startVector, the (old) normal vector and this.endVector
      // Compute a temporary normal from the two points' vectors
      this.tmpVector.crossVectors(
        this._startSEPoint.locationVector,
        this._endSEPoint.locationVector
      );
      // Check to see if the temporary normal is zero (i.e the start and end vectors are parallel -- ether
      // nearly antipodal or in the same direction)
      if (this.tmpVector.isZero()) {
        // Make the tmpVector (soon to be the to vector) unit
        this.tmpVector.normalize();
        if (this._normalVector.length() == 0) {
          // The normal vector is still at its initial value so can't be used to compute the next normal, so set the
          // the normal vector to an arbitrarily chosen vector perpendicular to the start vector
          this.tmpVector.set(1, 0, 0);
          this.tmpVector.crossVectors(
            this._startSEPoint.locationVector,
            this.tmpVector
          );
          if (this.tmpVector.isZero()) {
            this.tmpVector.set(0, 1, 0);
            // The cross or startVector and (1,0,0) and (0,1,0) can't *both* be zero
            this.tmpVector.crossVectors(
              this._startSEPoint.locationVector,
              this.tmpVector
            );
          }
        } else {
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
      }
      // The normal vector is now set
      this._normalVector.copy(this.tmpVector).normalize();

      // Record if the previous segment was longThanPi
      let longerThanPi = this.arcLength > Math.PI;

      // Set the arc length of the segment temporarily to the angle between start and end vectors (always less than Pi)
      this.arcLength = this._startSEPoint.locationVector.angleTo(
        this._endSEPoint.locationVector
      );

      // Check to see if the longThanPi variable needs updating.
      // First see if start and end vectors are even close to antipodal (which is when longerThanPi and nearly antipodal might need updating)
      if (
        this._startSEPoint.locationVector.angleTo(
          this._endSEPoint.locationVector
        ) > 2
      ) {
        // The startVector and endVector might be antipodal proceed with caution,
        // Set tmpVector to the antipode of the start Vector
        this.tmpVector
          .copy(this._startSEPoint.locationVector)
          .multiplyScalar(-1);
        // Check to see if the pixel distance (in the default screen plane)
        if (
          this.tmpVector.angleTo(this._endSEPoint.locationVector) *
            SETTINGS.boundaryCircle.radius <
          SETTINGS.nearlyAntipodalPixel
        ) {
          // The points are antipodal on the screen
          this.nearlyAntipodal = true;
        } else {
          // Right here is why we need this from one update to the next!
          if (this.nearlyAntipodal) {
            longerThanPi = !longerThanPi;
          }
          this.nearlyAntipodal = false;
        }
      }
      // Now longerThanPi is correctly set, update the arcLength based on it
      if (longerThanPi) {
        this.arcLength = 2 * Math.PI - this.arcLength;
      }

      ////////////////////////////////////////////////////////////////////////////////////////
      this.ref.startVector = this._startSEPoint.locationVector;
      this.ref.arcLength = this.arcLength;
      this.ref.normalVector = this._normalVector;
      // update the display of the segment now that the start, normal vectors and arcLength are set, but only if showing
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
