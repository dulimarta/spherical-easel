import { SEPoint } from "./SEPoint";
import Point from "@/plottables/Point";
import Two from "two.js";
import { Matrix4, Vector3 } from "three";
import Segment from "@/plottables/Segment";
import globalSettings from "@/global-settings";
import SETTINGS from "@/global-settings";

const MIDPOINT_MOVEMENT_THRESHOLD = SETTINGS.segment.midPointMovementThreshold;

/** Temporary vector2 to help with calculations */
const tmpVector1 = new Vector3();
const tmpVector2 = new Vector3();

export class SESegmentMidPoint extends SEPoint {
  /**
   * The (model) start SEPoint of the line segment
   */
  private startSEPoint: SEPoint;
  /**
   * The (model) end SEPoint of the line segment
   */
  private endSEPoint: SEPoint;

  /**
   * Flag set if the parent segment is longer than Pi
   */
  private longerThanPi = false;
  /**
   * Flag set if the startSEPoint and the endSEPoint are nearly antipodal
   */
  private nearlyAntipodal = false;

  /**
   * Temporary midVector
   * This holds a candidate midpoint vector to see so that if updating the segment moves the midpoint too much
   */
  private tempMidVector = new Vector3(); //

  /**
   * Create a model SESegmentMidPoint using:
   * @param pt The plottable TwoJS Object associated to this object
   * @param segmentStartSEPoint The model SEPoint object that is the start of the segment
   * @param segmentEndSEPoint The model SEPoint object that is the end of the segment
   */
  constructor(
    pt: Point,
    segmentStartSEPoint: SEPoint,
    segmentEndSEPoint: SEPoint
  ) {
    super(pt);
    this.name = `MidPointSegment (${segmentStartSEPoint.name},${segmentEndSEPoint.name})`;
    // Place registerChild calls AFTER the name is set
    // so debugging output shows name correctly
    this.startSEPoint = segmentStartSEPoint;
    this.endSEPoint = segmentEndSEPoint;

    segmentStartSEPoint.registerChild(this);
    segmentEndSEPoint.registerChild(this);

    // Segment midpoints set invisible, unless constructed by the midPoint tool
    this.setShowing(false);
  }

  // This kind of point is *never* free, so override the isFreeToMove method
  public isFreeToMove(): this is SEPoint {
    return false;
  }

  public update() {
    if (!this.canUpdateNow()) {
      return;
    }
    console.debug("Updating midpoint of segment", this.name);

    // check to see if the start and end point are even close to antipodal. To see if longerThanPi or nearlyAntipodal should change.
    if (
      this.startSEPoint.vectorPosition.angleTo(this.endSEPoint.vectorPosition) >
      2
    ) {
      // Test to see if startSEPoint and the endSEPoint might be antipodal, possibly update longerThanPi
      // Use pixel distance because the will more closely mirror the experience of the user.
      if (
        SETTINGS.boundaryCircle.radius *
          (Math.PI -
            this.startSEPoint.vectorPosition.angleTo(
              this.endSEPoint.vectorPosition
            )) <
        SETTINGS.point.hitPixelDistance
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
    this.vectorLocation = this.tempMidVector
      .addVectors(
        this.startSEPoint.vectorPosition,
        this.endSEPoint.vectorPosition
      )
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(this.longerThanPi ? -1 : 1);

    // Set the position of the associated displayed plottable Point
    this.ref.positionVector = this.vectorLocation;

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
