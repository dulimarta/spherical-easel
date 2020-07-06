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

  /** Temporary midVector */
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

  // This kind of point is *never* free, so override the isFreeToMove method
  public isFreeToMove(): this is SEPoint {
    return false;
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
