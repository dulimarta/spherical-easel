import { Vector3 } from "three";
import Two from "two.js";
import SETTINGS from "@/global-settings";

/**
 * Geodesic line on a circle
 *
 * @export
 * @class Line
 * @extends {Mesh}
 */
export default class Line extends Two.Group {
  private start: Vector3;
  private end: Vector3;
  private normalDirection: Vector3;

  private scaleVector: Two.Vector;
  private segment: boolean;
  private frontHalf: Two.Path;
  private backHalf: Two.Path;
  constructor(start?: Vector3, end?: Vector3, segment?: boolean) {
    super();
    const radius = SETTINGS.sphere.radius;
    const vertices: Two.Vector[] = [];
    // Generate 2D coordinates of a half circle
    for (let k = 0; k <= 90; k++) {
      const angle = (k * Math.PI) / 90;
      const px = radius * Math.cos(angle);
      const py = radius * Math.sin(angle);
      vertices.push(new Two.Vector(px, py));
    }
    this.frontHalf = new Two.Path(
      vertices,
      /* closed */ false,
      /* curve */ false
    );
    this.frontHalf.linewidth = 5;
    this.frontHalf.stroke = "green";
    // Create the back half circle by cloning the front half
    // and then rotate by 180 degrees
    this.backHalf = this.frontHalf.clone();
    this.backHalf.rotation = Math.PI;
    this.backHalf.stroke = "gray";
    (this.backHalf as any).dashes.push(10, 3); // render as dashed lines
    this.backHalf.linewidth = 5;
    this.start = start || new Vector3(1, 0, 0);
    this.end = end || new Vector3(0, 1, 0);
    this.normalDirection = new Vector3();
    this.segment = segment || false;
    this.scaleVector = new Two.Vector(1, 1);
    this.add(this.frontHalf, this.backHalf);
  }

  private deformIntoEllipse() {
    // The circle plane passes through three points the origin (0,0,0)
    // and the two points (start (S) and end (E)). The normal of this plane
    // is the cross product of SxE
    this.normalDirection.crossVectors(this.start, this.end).normalize();

    // The ellipse major axis on the XY plane is perpendicular
    // to the circle normal [Nx,Ny,Nz]. We can fix the direction of
    // the major axis to [Ny,-Nx, 0] and use these numbers to compute the angle
    const angleToMajorAxis = Math.atan2(
      this.normalDirection.x,
      this.normalDirection.y
    );

    // Calculate the length of its minor axes from the non-rotated ellipse
    const cosAngle = Math.cos(angleToMajorAxis);
    const sinAngle = Math.sin(angleToMajorAxis);
    // (Px,Py) is the projected start point of the non-rotated ellipse
    // apply the reverse rotation to the start point
    const px = cosAngle * this.start.x - sinAngle * this.start.y;
    const py = sinAngle * this.start.x + cosAngle * this.start.y;

    // Use ellipse equation to compute minorAxis given than majorAxis is 1
    const minorAxis = Math.sqrt((py * py) / (1 - px * px));

    this.scaleVector.set(1, minorAxis * Math.sign(this.normalDirection.z));

    // FIXME: TwoJS issue: scaling the shape also make the line thinner
    (this.frontHalf as any).scale = this.scaleVector;
    (this.backHalf as any).scale = this.scaleVector;

    this.rotation = angleToMajorAxis;
    if (this.segment) {
      // Readjust arc length
      // const angle = this.start.angleTo(this.end);
      // this.geometry.dispose();
      // this.geometry = new TorusBufferGeometry(
      //   SETTINGS.sphere.radius,
      //   /* thickness */ 0.01,
      //   /* tubular segments */ 6,
      //   /* radial segments */ 60,
      //   angle
      // );
    }
  }

  // Use JavaScript setter functions to auto compute
  // the other properties of this object
  set isSegment(value: boolean) {
    this.segment = value;
    // this.name = (value ? "Segment-" : "Line-") + this.id;
  }

  set startPoint(position: Vector3) {
    this.start.copy(position);
    this.deformIntoEllipse();
  }

  set endPoint(position: Vector3) {
    this.end.copy(position);
    this.deformIntoEllipse();
  }

  // It looks like we have to define our own clone() function
  // The builtin clone() does not seem to work correctly
  // clone(): this {
  //   const dup = new Line(this.start, this.end, this._segment);
  //   (dup.geometry as BufferGeometry).copy(
  //     (this.geometry as BufferGeometry).clone()
  //   );
  //   dup.rotation.copy(this.rotation);
  //   dup._segment = this._segment;
  //   dup.start.copy(this.start);
  //   dup.end.copy(this.end);
  //   return dup as this;
  // }
}
