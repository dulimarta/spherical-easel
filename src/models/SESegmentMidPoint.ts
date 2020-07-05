import { SEPoint } from "./SEPoint";
import Point from "@/plottables/Point";
import Two from "two.js";
import { Matrix4, Vector3 } from "three";
import Segment from "@/plottables/Segment";
import globalSettings from "@/global-settings";
import SETTINGS from "@/global-settings";

const MIDPOINT_MOVEMENT_THRESHOLD = 2.0; /* in degrees */

/** A temporary vector to help with calculations */
const tmpVector = new Vector3();

export class SESegmentMidPoint extends SEPoint {
  /**
   * The (model) start and end SEPoints of the line segment
   */
  private startSEPoint: SEPoint;
  private endSEPoint: SEPoint;

  /**
   * Flag set if the parent segment is longer than Pi
   */
  private longerThanPi = false;
  /**
   * Flag set if the startSEPoint and the ednSEPoint are nearly antipodal
   */
  private nearlyAntipodal = false;

  /** Temporary midvector */
  private tempMidVector = new Vector3(); // This holds a candidate midpoint vector to see so that if updating the segment moves the midpoint too much

  constructor(p: Point, segmentStartPoint: SEPoint, segmentEndPoint: SEPoint) {
    super(p);
    this.name = `MidPointSegment (${segmentStartPoint.name},${segmentEndPoint.name})`;
    // Place registerChild calls AFTER the name is set
    // so debugging output shows name correctly
    this.startSEPoint = segmentStartPoint;
    this.endSEPoint = segmentEndPoint;

    segmentStartPoint.registerChild(this);
    segmentEndPoint.registerChild(this);

    // Segment midpoints set invisible, unless constructed by the midPoint tool
    this.setShowing(false);
  }

  public update() {
    if (!this.canUpdateNow()) {
      return;
    }
    console.debug("Updating midpoint of segment", this.name);

    if (
      this.startSEPoint.vectorPosition.angleTo(this.endSEPoint.vectorPosition) >
      2
    ) {
      // The startSEPoint and the endSEPoint might be antipodal proceed with caution, possibly update longerThanPi
      if (
        this.startSEPoint.vectorPosition.distanceTo(
          this.endSEPoint.vectorPosition.multiplyScalar(-1)
        ) < SETTINGS.point.hitIdealDistance
      ) {
        this.nearlyAntipodal = true;
      } else {
        if (this.nearlyAntipodal) {
          this.longerThanPi = !this.longerThanPi;
        }
        this.nearlyAntipodal = false;
      }
    }
    // The value of longerThanPi is correctly set so use that to create a candidate midVector
    this.tempMidVector
      .addVectors(
        this.startSEPoint.vectorPosition,
        this.endSEPoint.vectorPosition
      )
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(this.longerThanPi ? -1 : 1);

    // moveAngle is angular change in the midpoint (from the (soon-to-be- former) vector location to tempMidVector)
    const moveAngle = this.tempMidVector.angleTo(this.vectorPosition);
    if (moveAngle.toDegrees() < MIDPOINT_MOVEMENT_THRESHOLD) {
      // For small movement, update the midpoint directly
      this.vectorPosition.copy(this.tempMidVector);
    } else {
      // For target movement, update the midpoint along the tangent curve
      // N = normalize(midVector X tempMidVector)
      tmpVector
        .crossVectors(this.vectorPosition, this.tempMidVector)
        .normalize();
      // tempVector =  normalize(N x oldMid) (notice that tempVector, N, oldMid are a unit orthonormal frame)
      tmpVector.cross(this.vectorPosition).normalize();
      // Now rotate in the oldMid, tempVector plane by the moveAngle (strangely this
      // works better than angle = MIDPOINT_MOVEMENT_THRESHOLD )
      // That is newMid = cos(angle)oldMid + sin(angle) tempVector
      this.vectorPosition.multiplyScalar(Math.cos(moveAngle));
      this.vectorPosition
        .addScaledVector(tmpVector, Math.sin(moveAngle))
        .normalize();
    }

    this.setOutOfDate(false);
    this.updateKids();
  }

  public setShowing(flag: boolean): void {
    if (flag) {
      super.setShowing(true);
    } else if (this.kids.length == 0) {
      // Hide only no one else depends on this intersection
      super.setShowing(false);
    }
  }
}
