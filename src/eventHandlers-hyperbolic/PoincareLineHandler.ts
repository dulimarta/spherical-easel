import {
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Scene,
  TorusGeometry,
  Vector2,
  Vector3
} from "three";
import { PoseTracker } from "./PoseTracker";
import { createPoint } from "@/plottables-hyperbolic/MeshFactory";
import { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";

export class PoincareLineHandler extends PoseTracker {
  disk: Object3D;
  private poincareStart = createPoint(0.05, "red");
  private poincareEnd = createPoint(0.05, "green");
  private poincareInverse = new Vector3();
  private circleCenter = createPoint(0.06, "orange");
  private boundaryStart = createPoint(0.05, "fuchsia");
  private boundaryEnd = createPoint(0.05, "palegreen");
  private poincareLine: Mesh;
  private pointsAdded = false;
  private infiniteLine = false;
  constructor(s: Scene, d: Object3D, useInfiniteLine: boolean) {
    super(s);
    this.disk = d;
    this.infiniteLine = useInfiniteLine;
    this.poincareStart.layers.set(HYPERBOLIC_LAYER.poincareDisk);
    this.poincareEnd.layers.set(HYPERBOLIC_LAYER.poincareDisk);
    this.circleCenter.layers.set(HYPERBOLIC_LAYER.poincareDisk);
    this.boundaryStart.layers.set(HYPERBOLIC_LAYER.poincareDisk);
    this.boundaryEnd.layers.set(HYPERBOLIC_LAYER.poincareDisk);
    this.poincareLine = new Mesh(
      new TorusGeometry(1, 0.02),
      new MeshStandardMaterial({ color: "brown" })
    );
    this.poincareLine.layers.set(HYPERBOLIC_LAYER.poincareDisk);
  }

  mousePressed(
    event: MouseEvent,
    pos2D: Vector2,
    pos3D: Vector3 | null,
    n: Vector3 | null
  ): void {
    super.mousePressed(event, pos2D, pos3D, n);
    if (pos3D) {
      const d = PoseTracker.hyperStore.$state.kleinDiskElevation;
      // const poincareZ = diskRadius - 1;
      const { x, y, z } = pos3D;
      const poincareScale = d / (Math.abs(z) + 1);
      this.poincareStart.position
        .set(x, y, 0)
        .multiplyScalar(poincareScale * Math.sign(z));
    }
  }

  mouseMoved(
    event: MouseEvent,
    scrPos: Vector2,
    position: Vector3 | null,
    direction: Vector3 | null
  ): void {
    super.mouseMoved(event, scrPos, position, direction);
    if (!this.isDragging) return;
    let { x: x1, y: y1, z: z1 } = this.first.position;
    let { x: x2, y: y2, z: z2 } = this.second.position;
    // console.debug(`Dragging in Poincare P1 ${x1 * x1 + y1 * y1} vs ${z1 * z1}`);
    // console.debug(`Dragging in Poincare P2 ${x2 * x2 + y2 * y2} vs ${z2 * z2}`);
    if (x1 * x1 + y1 * y1 <= z1 * z1 && x2 * x2 + y2 * y2 <= z2 * z2) {
      const kleinRadius = PoseTracker.hyperStore.$state.kleinDiskElevation;
      // Calculate the radius of Poincare disk from Klein disk with the assumption
      // that:
      // - Klein disk is the projection plane with center (COP) at (0,0,0)
      // - Poincare disk is the projection plane with center at (0,0,-1)
      // - The tho projection planes are "virtually" separated by 1 unit
      //   with the Poincare disk being closer to the COP.
      const poincareRadius = (kleinRadius * kleinRadius) / (kleinRadius + 1);
      const poincareScale = kleinRadius / (Math.abs(z2) + 1);
      this.poincareEnd.position
        .set(x2, y2, 0)
        .multiplyScalar(poincareScale * Math.sign(z2));

      // The construction of Poincare line is referenced from here:
      // https://math.stackexchange.com/questions/1322444/how-to-construct-a-line-on-a-poincare-disk
      const { x: xe, y: ye } = this.poincareEnd.position;

      // Compute the inverse of the end point
      this.poincareInverse
        .copy(this.poincareEnd.position)
        .multiplyScalar(
          (poincareRadius * poincareRadius) / (xe * xe + ye * ye)
        );

      // A circle through 3 points (start, end, inverseEnd)
      this.computePoincareCircle(
        this.poincareStart.position,
        this.poincareEnd.position,
        this.poincareInverse,
        poincareRadius
      );
      if (!this.pointsAdded) {
        this.disk.add(this.poincareStart);
        this.disk.add(this.poincareEnd);
        // this.disk.add(this.circleCenter);
        this.disk.add(this.poincareLine);
        if (this.infiniteLine) {
          this.disk.add(this.boundaryStart);
          this.disk.add(this.boundaryEnd);
        }
        this.pointsAdded = true;
      }
    } else {
      this.disk.remove(this.poincareStart);
      this.disk.remove(this.poincareEnd);
      // this.disk.remove(this.circleCenter);
      this.disk.remove(this.poincareLine);
      this.disk.remove(this.boundaryStart);
      this.disk.remove(this.boundaryEnd);
      this.pointsAdded = false;
    }
  }

  mouseReleased(event: MouseEvent, p: Vector3, d: Vector3): void {
    super.mouseReleased(event, p, d);
    this.disk.remove(this.poincareStart);
    this.disk.remove(this.poincareEnd);
    // this.disk.remove(this.circleCenter);
    this.disk.remove(this.poincareLine);
    this.disk.remove(this.boundaryStart);
    this.disk.remove(this.boundaryEnd);
    this.pointsAdded = false;
  }

  private computePoincareCircle(
    p: Vector3,
    q: Vector3,
    r: Vector3,
    diskRadius: number
    // bp: Vector3,
    // bq: Vector3
  ) {
    const { x: x1, y: y1 } = p;
    const { x: x2, y: y2 } = q;
    const { x: x3, y: y3 } = r;
    // console.debug(
    //   `Circle points R(${x1.toFixed(2)},${y1.toFixed(2)})` +
    //     ` G(${x2.toFixed(2)},${y2.toFixed(2)})` +
    //     ` B(${x3.toFixed(2)},${y3.toFixed(2)})`
    // );
    // https://math.stackexchange.com/questions/213658/get-the-equation-of-a-circle-when-given-3-points
    const x1sq = x1 * x1;
    const y1sq = y1 * y1;
    const x2sq = x2 * x2;
    const y2sq = y2 * y2;
    const x3sq = x3 * x3;
    const y3sq = y3 * y3;
    // M-jk is the (j,k) minor of the 4x4 matrix
    const M11 = x1 * (y2 - y3) - y1 * (x2 - x3) + x2 * y3 - x3 * y2;
    const M12 =
      (x1sq + y1sq) * (y3 - y2) +
      (x2sq + y2sq) * (y1 - y3) +
      (x3sq + y3sq) * (y2 - y1);
    const M13 =
      (x1sq + y1sq) * (x2 - x3) +
      (x2sq + y2sq) * (x3 - x1) +
      (x3sq + y3sq) * (x1 - x2);
    const M14 =
      (x1sq + y1sq) * (x3 * y2 - x2 * y3) +
      (x2sq + y2sq) * (x1 * y3 - x3 * y1) +
      (x3sq + y3sq) * (x2 * y1 - x1 * y2);
    const ctrX = -M12 / (2 * M11);
    const ctrY = -M13 / (2 * M11);
    const radius =
      Math.sqrt(M12 * M12 + M13 * M13 - 4 * M11 * M14) / (2 * Math.abs(M11));
    this.circleCenter.position.set(ctrX, ctrY, 0);
    this.poincareLine.position.set(ctrX, ctrY, 0);

    let dx1: number;
    let dx2: number;
    let dy1: number;
    let dy2: number;
    if (this.infiniteLine) {
      // Find intersection of the two circles using the following reference
      // https://math.stackexchange.com/questions/256100/how-can-i-find-the-points-at-which-two-circles-intersect

      // with special case (x1,y1) = (0,0)
      const d = Math.sqrt(ctrX * ctrX + ctrY * ctrY); // distance between circle centers
      const l = (diskRadius * diskRadius - radius * radius + d * d) / (2 * d); // distance to common chord
      const h = Math.sqrt(diskRadius * diskRadius - l * l); // half length of the common chord
      const xBeg = (l * ctrX + h * ctrY) / d;
      const xEnd = (l * ctrX - h * ctrY) / d;
      const yBeg = (l * ctrY - h * ctrX) / d;
      const yEnd = (l * ctrY + h * ctrX) / d;
      this.boundaryStart.position.set(xBeg, yBeg, 0);
      this.boundaryEnd.position.set(xEnd, yEnd, 0);
      dx1 = xBeg - ctrX;
      dx2 = xEnd - ctrX;
      dy1 = yBeg - ctrY;
      dy2 = yEnd - ctrY;
    } else {
      dx1 = x1 - ctrX;
      dx2 = x2 - ctrX;
      dy1 = y1 - ctrY;
      dy2 = y2 - ctrY;
    }
    // Determine the start and end angles of the arc
    const isClockwise = dx1 * dy2 - dx2 * dy1 > 0; // Z component of cross product
    let angle1 = Math.atan2(dy1, dx1);
    let angle2 = Math.atan2(dy2, dx2);
    let arcSpan = isClockwise ? angle2 - angle1 : angle1 - angle2;
    // console.debug(
    //   `Angle range ${angle1.toDegrees().toFixed(0)} ${angle2
    //     .toDegrees()
    //     .toFixed(0)} ${arcSpan > Math.PI ? "Wide" : "Normal"} Arc span ${arcSpan
    //     .toDegrees()
    //     .toFixed(0)}`
    // );
    if (arcSpan < 0) arcSpan += 2 * Math.PI;

    // Replace the torus with a new one
    this.poincareLine.geometry.dispose();
    this.poincareLine.geometry = new TorusGeometry(
      radius,
      0.02,
      24,
      90,
      arcSpan
    );
    this.poincareLine.geometry.rotateZ(isClockwise ? angle1 : angle2);
  }
}
